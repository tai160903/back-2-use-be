import { Connection, Model, Types } from 'mongoose';
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  BorrowTransaction,
  BorrowTransactionDocument,
} from 'src/modules/borrow-transactions/schemas/borrow-transactions.schema';
import {
  SingleUseProduct,
  SingleUseProductDocument,
} from 'src/modules/single-use-product/schemas/single-use-product.schema';
import {
  SingleUseProductUsage,
  SingleUseProductUsageDocument,
} from 'src/modules/single-use-product-usage/schemas/single-use-product-usage.schema';
import { CreateSingleUseUsageDto } from '../dto/create-single-use-product-usage';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { BorrowTransactionStatus } from 'src/common/constants/borrow-transaction-status.enum';
import { Staff, StaffDocument } from 'src/modules/staffs/schemas/staffs.schema';
import { RolesEnum } from 'src/common/constants/roles.enum';
import {
  Customers,
  CustomersDocument,
} from 'src/modules/users/schemas/customer.schema';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import {
  Product,
  ProductDocument,
} from 'src/modules/products/schemas/product.schema';
import {
  Material,
  MaterialDocument,
} from 'src/modules/materials/schemas/material.schema';
import { handleReuseLimit } from 'src/modules/borrow-transactions/helpers/handle-reuse-limit.helper';
import {
  ProductGroup,
  ProductGroupDocument,
} from 'src/modules/product-groups/schemas/product-group.schema';
import { NotificationReferenceTypeEnum } from 'src/common/constants/notification-reference-type.enum';
import { NotificationTypeEnum } from 'src/common/constants/notification.enum';
import { BusinessDocument, Businesses } from '../schemas/businesses.schema';
import { recordUsageOnChain } from 'src/infrastructure/polygon/blockchain/usageRegistry.service';

@Injectable()
export class BusinessSingleUseUsageService {
  constructor(
    @InjectModel(BorrowTransaction.name)
    private readonly borrowTransactionModel: Model<BorrowTransactionDocument>,

    @InjectModel(SingleUseProduct.name)
    private readonly singleUseProductModel: Model<SingleUseProductDocument>,

    @InjectModel(SingleUseProductUsage.name)
    private readonly usageModel: Model<SingleUseProductUsageDocument>,

    @InjectModel(Staff.name)
    private readonly staffModel: Model<StaffDocument>,

    @InjectModel(Customers.name)
    private readonly customerModel: Model<CustomersDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(Material.name)
    private readonly materialModel: Model<MaterialDocument>,

    @InjectModel(ProductGroup.name)
    private readonly productGroupModel: Model<ProductGroupDocument>,

    @InjectModel(Businesses.name)
    private readonly businessesModel: Model<BusinessDocument>,

    @InjectConnection()
    private readonly connection: Connection,

    private readonly notificationsService: NotificationsService,
  ) {}

  async createUsage(
    borrowTransactionId: string,
    userId: string,
    roles: RolesEnum[],
    dto: CreateSingleUseUsageDto,
  ): Promise<APIResponseDto<SingleUseProductUsage>> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const userObjectId = new Types.ObjectId(userId);
      let staffId: Types.ObjectId | null = null;

      // =========================
      // 0️⃣ Resolve role
      // =========================
      if (roles.includes(RolesEnum.STAFF)) {
        const staff = await this.staffModel
          .findOne({ userId: userObjectId, status: 'active' })
          .session(session);

        if (!staff) {
          throw new ForbiddenException('Staff not found or inactive');
        }

        staffId = staff._id;
      } else if (!roles.includes(RolesEnum.BUSINESS)) {
        throw new ForbiddenException('User is not allowed to record usage');
      }

      // =========================
      // 1️⃣ Borrow transaction
      // =========================
      const borrow = await this.borrowTransactionModel
        .findById(borrowTransactionId)
        .session(session);

      if (!borrow) {
        throw new NotFoundException('Borrow transaction not found');
      }

      if (borrow.status !== BorrowTransactionStatus.BORROWING) {
        throw new BadRequestException(
          'Cannot record single-use consumption when status is not borrowing',
        );
      }

      const business = await this.businessesModel
        .findById(borrow.businessId)
        .session(session);

      if (!business) {
        throw new NotFoundException('Business not found');
      }

      // =========================
      // 2️⃣ Staff must belong to same business
      // =========================
      if (staffId) {
        const staff = await this.staffModel.findById(staffId).session(session);

        if (!staff) {
          throw new NotFoundException('Staff not found');
        }

        if (!staff.businessId.equals(borrow.businessId)) {
          throw new ForbiddenException(
            'Staff does not belong to this business',
          );
        }
      }

      // =========================
      // 3️⃣ Load product + productGroup + material (reuse logic)
      // =========================
      const product = await this.productModel
        .findById(borrow.productId)
        .session(session);

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const productGroup = await this.productGroupModel
        .findById(product.productGroupId)
        .session(session);

      if (!productGroup) {
        throw new NotFoundException('Product group not found');
      }

      const material = await this.materialModel
        .findById(productGroup.materialId)
        .session(session);

      if (!material) {
        throw new NotFoundException('Material not found');
      }

      if (
        product.reuseCount >= material.reuseLimit &&
        !['damaged', 'lost'].includes(product.condition)
      ) {
        throw new BadRequestException(
          'This product has reached its maximum reuse limit and can no longer be reused',
        );
      }

      // =========================
      // 4️⃣ Find customer (for notification)
      // =========================
      const customer = await this.customerModel
        .findById(borrow.customerId)
        .select('userId co2Reduced')
        .session(session);

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      // =========================
      // 5️⃣ Single-use product validation
      // =========================
      const singleUseProduct = await this.singleUseProductModel
        .findById(dto.singleUseProductId)
        .session(session);

      if (!singleUseProduct) {
        throw new NotFoundException('Single-use product not found');
      }

      if (!singleUseProduct.businessId.equals(borrow.businessId)) {
        throw new BadRequestException(
          'Single-use product does not belong to this business',
        );
      }

      if (!singleUseProduct.isActive) {
        throw new BadRequestException('Single-use product is not active');
      }

      // =========================
      // 6️⃣ CO₂ snapshot
      // =========================
      const addedCo2 = singleUseProduct.co2Emission;

      // =========================
      // 7️⃣ Create usage record
      // =========================
      const [usage] = await this.usageModel.create(
        [
          {
            borrowTransactionId: borrow._id,
            businessId: borrow.businessId,
            customerId: borrow.customerId,
            singleUseProductId: singleUseProduct._id,
            co2PerUnit: addedCo2,
            staffId,
            note: dto.note?.trim(),
          },
        ],
        { session },
      );

      // =========================
      // 8️⃣ Update product reuse
      // =========================
      product.reuseCount += 1;
      handleReuseLimit(product, material);
      await product.save({ session });

      // =========================
      // 9️⃣ Update borrow CO₂
      // =========================
      borrow.co2Changed = Number(
        ((borrow.co2Changed || 0) + addedCo2).toFixed(3),
      );

      business.co2Reduced = Number(
        ((business.co2Reduced || 0) + addedCo2).toFixed(3),
      );

      customer.co2Reduced = Number(
        ((customer.co2Reduced || 0) + addedCo2).toFixed(3),
      );

      await Promise.all([
        borrow.save({ session }),
        business.save({ session }),
        customer.save({ session }),
      ]);

      // =========================
      // 🔟 Commit transaction
      // =========================
      await session.commitTransaction();

      // =========================
      // 🔗 11️⃣ Record usage on blockchain (non-blocking)
      // =========================
      recordUsageOnChain(
        usage._id.toString(),
        borrow.businessId.toString(),
        Math.round(addedCo2 * 1000),
      )
        .then(async (result) => {
          usage.blockchainTxHash = result.txHash;
          await usage.save();
          console.log('[Blockchain] Usage recorded:', result.txHash);
        })
        .catch((err) => {
          console.error('[Blockchain] Failed to record usage', err);
        });

      // =========================
      // 🔔 Notification (safe)
      // =========================
      const message = `A single-use item was recorded. Thank you for staying aware of your environmental impact. Estimated CO₂ impact: ${addedCo2} kg.`;

      try {
        if (customer?.userId) {
          await this.notificationsService.create({
            receiverId: new Types.ObjectId(String(customer.userId)),
            receiverType: 'customer',
            title: 'Single-use Consumption Recorded',
            message,
            type: NotificationTypeEnum.USAGE,
            referenceId: borrow._id,
            referenceType: NotificationReferenceTypeEnum.BORROW,
          });
        }
      } catch (err) {
        console.warn(
          'Failed to send single-use usage notification',
          (err as Error)?.message || err,
        );
      }

      return {
        statusCode: HttpStatus.CREATED,
        message,
        data: usage,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
