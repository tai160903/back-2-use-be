import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { InjectModel } from '@nestjs/mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { BusinessForm } from '../../businesses/schemas/business-form.schema';
import { Businesses } from '../../businesses/schemas/businesses.schema';
import { Users } from '../../users/schemas/users.schema';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { BusinessFormStatusEnum } from 'src/common/constants/business-form-status.enum';
import { MailerService } from 'src/infrastructure/mailer/mailer.service';
import {
  businessApprovedTemplate,
  businessRejectedTemplate,
} from 'src/infrastructure/mailer/templates/business-form.template';
import { Subscriptions } from 'src/modules/subscriptions/schemas/subscriptions.schema';
import { BusinessSubscriptions } from 'src/modules/businesses/schemas/business-subscriptions.schema';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { Wallets } from 'src/modules/wallets/schemas/wallets.schema';
import { WalletTransactions } from 'src/modules/wallet-transactions/schema/wallet-transactions.schema';
import { GeocodingService } from 'src/infrastructure/geocoding/geocoding.service';
import { Customers } from 'src/modules/users/schemas/customer.schema';

@Injectable()
export class AdminBusinessFormService {
  constructor(
    @InjectModel(BusinessForm.name)
    private businessFormModel: Model<BusinessForm>,
    @InjectModel(Users.name) private userModel: Model<Users>,
    @InjectModel(Businesses.name) private businessModel: Model<Businesses>,
    @InjectModel(Customers.name) private customerModel: Model<Customers>,
    @InjectModel(Subscriptions.name)
    private subscriptionModel: Model<Subscriptions>,
    @InjectModel(BusinessSubscriptions.name)
    private businessSubscriptionModel: Model<BusinessSubscriptions>,
    @InjectModel(Wallets.name) private walletModel: Model<Wallets>,
    @InjectModel(WalletTransactions.name)
    private walletTransactionsModel: Model<WalletTransactions>,
    private mailerService: MailerService,
    private readonly geocodingService: GeocodingService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async approveBusiness(id: string): Promise<APIResponseDto> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const businessForm = await this.businessFormModel
        .findById(id)
        .session(session);
      if (!businessForm) {
        await session.abortTransaction();
        return {
          statusCode: 404,
          message: 'Business form not found',
        };
      }

      if (businessForm.status === BusinessFormStatusEnum.APPROVED) {
        await session.abortTransaction();
        throw new HttpException(
          'Business form is already approved',
          HttpStatus.BAD_REQUEST,
        );
      }

      const customer = await this.customerModel
        .findById(businessForm.customerId)
        .session(session);
      if (!customer) {
        await session.abortTransaction();
        throw new HttpException(
          'Customer not found for this business form',
          HttpStatus.NOT_FOUND,
        );
      }

      const user = await this.userModel
        .findById(customer.userId)
        .session(session);
      if (!user) {
        await session.abortTransaction();
        throw new HttpException(
          'User not found for this business form',
          HttpStatus.NOT_FOUND,
        );
      }

      if (!user.role.includes(RolesEnum.CUSTOMER)) {
        await session.abortTransaction();
        throw new HttpException(
          'Only customers can be approved as businesses',
          HttpStatus.BAD_REQUEST,
        );
      }

      const hasPending = await this.walletTransactionsModel
        .exists({
          relatedUserId: user._id,
          status: 'pending',
        })
        .session(session);
      if (hasPending) {
        await session.abortTransaction();
        throw new HttpException(
          'User has pending wallet transactions. Please try approval later.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const { latitude, longitude } =
        await this.geocodingService.getCoordinates(
          businessForm.businessAddress,
        );

      const business = new this.businessModel({
        userId: user._id,
        businessFormId: businessForm._id,
        businessMail: businessForm.businessMail,
        businessName: businessForm.businessName,
        businessAddress: businessForm.businessAddress,
        businessPhone: businessForm.businessPhone,
        taxCode: businessForm.taxCode,
        businessType: businessForm.businessType,
        businessLogoUrl: businessForm.businessLogoUrl,
        foodSafetyCertUrl: businessForm.foodSafetyCertUrl,
        businessLicenseUrl: businessForm.businessLicenseUrl,
        openTime: businessForm.openTime,
        closeTime: businessForm.closeTime,
        location:
          longitude && latitude
            ? {
                type: 'Point',
                coordinates: [longitude, latitude],
              }
            : undefined,
      });
      await business.save({ session });

      let existingBusinessWallet = await this.walletModel
        .findOne({
          userId: user._id,
          type: 'business',
        })
        .session(session);

      if (!existingBusinessWallet) {
        const createdWallets = await this.walletModel.create(
          [
            {
              userId: user._id,
              type: 'business',
              availableBalance: 0,
              holdingBalance: 0,
            },
          ],
          { session },
        );
        existingBusinessWallet = createdWallets[0];
      }

      const customerWallet = await this.walletModel
        .findOne({
          userId: user._id,
          type: 'customer',
        })
        .session(session);

      if (customerWallet && customerWallet.holdingBalance > 0) {
        await session.abortTransaction();
        throw new HttpException(
          'Customer wallet has funds on hold. Complete or cancel active operations before approval.',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!user.role.includes(RolesEnum.BUSINESS)) {
        user.role.push(RolesEnum.BUSINESS);
        await user.save({ session });
      }

      businessForm.status = BusinessFormStatusEnum.APPROVED;
      await businessForm.save({ session });

      await session.commitTransaction();

      let mailResult;
      try {
        mailResult = await this.mailerService.sendMail({
          to: [
            {
              name: user.username,
              address: user.email,
            },
          ],
          subject: 'Business Approved - Welcome to Back 2 Use!',
          html: businessApprovedTemplate(user.username),
        });
      } catch (error) {
        console.error('Email sending failed:', error);
        mailResult = false;
      }

      return {
        statusCode: 200,
        message: 'Business approved successfully.',
        data: {
          businessForm,
          business,
          emailSent: !!mailResult,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      throw new HttpException(
        (error as Error).message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.endSession();
    }
  }

  async rejectBusiness(id: string, note: string): Promise<APIResponseDto> {
    if (!note || note.trim().length === 0) {
      return {
        statusCode: 400,
        message: 'Rejection note is required',
      };
    }

    const businessForm = await this.businessFormModel.findById(id);
    if (!businessForm) {
      return {
        statusCode: 404,
        message: 'Business form not found',
      };
    }
    const customer = await this.customerModel.findById(businessForm.customerId);
    let user: Users | null = null;
    if (customer) {
      user = await this.userModel.findById(customer.userId);
    }
    businessForm.status = BusinessFormStatusEnum.REJECTED;
    businessForm.rejectNote = note;
    await businessForm.save();

    try {
      const mailResult = await this.mailerService.sendMail({
        to: [
          {
            name: user?.username || businessForm.businessName,
            address: user?.email || businessForm.businessMail,
          },
        ],
        subject: 'Business Rejected',
        html: businessRejectedTemplate(
          user?.username || businessForm.businessName,
          note,
        ),
      });
      if (!mailResult) {
        throw new Error('Failed to send rejection email');
      }
    } catch (error) {
      return {
        statusCode: 500,
        message: `Business rejected but failed to send email: ${(error as Error).message || 'Unknown error'}`,
        data: businessForm,
      };
    }
    return {
      statusCode: 200,
      message: 'Business rejected and email sent.',
      data: businessForm,
    };
  }

  async getAllForms(
    page = 1,
    limit = 10,
    status?: string,
  ): Promise<APIPaginatedResponseDto<BusinessForm[]>> {
    try {
      const skip = (page - 1) * limit;
      const query: any = {};
      if (status) query.status = status;
      const [forms, total] = await Promise.all([
        this.businessFormModel
          .find(query)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        this.businessFormModel.countDocuments(query),
      ]);
      return {
        statusCode: 200,
        message: 'Fetched all business forms',
        data: forms,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: 'Error fetching business forms',
        data: [],
        total: 0,
        currentPage: page,
        totalPages: 0,
      };
    }
  }

  async getFormDetail(id: string): Promise<APIResponseDto> {
    try {
      const form = await this.businessFormModel.findById(id);
      if (!form) {
        return {
          statusCode: 404,
          message: 'Business form not found',
        };
      }
      return {
        statusCode: 200,
        message: 'Fetched business form detail',
        data: form,
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: 'Error fetching business form detail',
        data: error.message,
      };
    }
  }
}
