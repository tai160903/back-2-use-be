import { isValidObjectId, Model, Types } from 'mongoose';
import {
  Injectable,
  Inject,
  HttpStatus,
  HttpException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Users, UsersDocument } from 'src/modules/users/schemas/users.schema';
import { GetCustomerQueryDto } from '../dto/admin-customer/get-customers-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { paginate } from 'src/common/utils/pagination.util';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { UserResponseDto } from '../dto/admin-customer/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { RolesEnum } from 'src/common/constants/roles.enum';
import {
  UserBlockHistory,
  UserBlockHistoryDocument,
} from 'src/modules/users/schemas/users-block-history';
import { UpdateCustomerBlockStatusDto } from '../dto/admin-customer/update-customer-block-status.dto';
import { blockNotificationTemplate } from 'src/infrastructure/mailer/templates/block-notification';
import { MailerDto } from 'src/infrastructure/mailer/dto/mailer.dto';
import { MailerService } from 'src/infrastructure/mailer/mailer.service';
import {
  Customers,
  CustomersDocument,
} from 'src/modules/users/schemas/customer.schema';
import { aggregatePaginate } from 'src/common/utils/aggregate-pagination.util';
import {
  CustomerDetailProjectionStage,
  CustomerProjectionStage,
  RemoveUserFieldStage,
  UserLookupStage,
} from 'src/common/pipelines';

@Injectable()
export class AdminCustomerService {
  constructor(
    @InjectModel(Users.name) private readonly userModel: Model<Users>,
    @InjectModel(UserBlockHistory.name)
    private readonly userBlockHistoryModel: Model<UserBlockHistoryDocument>,
    @InjectModel(Customers.name)
    private readonly customerModel: Model<Customers>,
    private mailerService: MailerService,
  ) {}

  projection =
    '_id name email phone address yob role isActive isBlocked createdAt updatedAt';

  // Admin get all users with role customer
  async getAllCustomers(
    query: GetCustomerQueryDto,
  ): Promise<APIPaginatedResponseDto<any[]>> {
    const { isBlocked, page = 1, limit = 10 } = query;

    const pipeline: Record<string, any>[] = [
      UserLookupStage,
      {
        $match: {
          ...(isBlocked !== undefined ? { 'user.isBlocked': isBlocked } : {}),
          'user.role': RolesEnum.CUSTOMER,
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      CustomerProjectionStage,
    ];

    const result = await aggregatePaginate(
      this.customerModel,
      pipeline,
      page,
      limit,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Customers retrieved successfully',
      data: result.data,
      total: result.total,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
    };
  }

  // Admin get customer by id
  async getCustomerById(id: string): Promise<APIResponseDto<Customers>> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid User ID '${id}'`);
    }

    const pipeline: any[] = [
      UserLookupStage,
      {
        $match: { _id: new Types.ObjectId(id) },
      },
      CustomerDetailProjectionStage,
      RemoveUserFieldStage,
    ];

    const result = await this.customerModel
      .aggregate<Customers>(pipeline)
      .exec();

    if (!result || result.length === 0) {
      throw new NotFoundException(`Customer with ID '${id}' not found`);
    }

    return {
      statusCode: HttpStatus.OK,
      message: `Get customer details successfully`,
      data: result[0],
    };
  }

  // Admin update customer block status
  async updateBlockStatus(
    id: string,
    dto: UpdateCustomerBlockStatusDto,
    adminId?: string,
  ): Promise<APIResponseDto<UserResponseDto>> {
    const { isBlocked, reason } = dto;

    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid User ID '${id}'`);
    }

    const user = await this.userModel.findOne({
      _id: id,
      role: RolesEnum.CUSTOMER,
    });
    // .select(this.projection);

    const customer = await this.customerModel.findOne({
      userId: new Types.ObjectId(id),
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (!user) {
      throw new NotFoundException('Associated user not found');
    }

    if (user.isBlocked === isBlocked) {
      return {
        statusCode: HttpStatus.OK,
        message: `Customer is already ${isBlocked ? 'blocked' : 'unblocked'}`,
      };
    }

    user.isBlocked = isBlocked;
    await user.save();

    await this.userBlockHistoryModel.create({
      userId: customer.userId,
      reason,
      isBlocked,
      blockBy: adminId || null,
    });

    const html = blockNotificationTemplate(
      customer.fullName,
      isBlocked,
      reason,
    );

    const mailer: MailerDto = {
      to: [{ name: customer.fullName, address: user.email }],
      subject: isBlocked
        ? 'Your Account Has Been Blocked'
        : 'Your Account Has Been Unblocked',
      html,
    };

    try {
      await this.mailerService.sendMail(mailer);
    } catch (error) {
      console.error('❌ Failed to send block/unblock email:', error.message);
    }

    const customerDto = plainToInstance(UserResponseDto, customer.toObject());

    return {
      statusCode: HttpStatus.OK,
      message: `Customer has been ${
        isBlocked ? 'blocked' : 'unblocked'
      } successfully and notification email has been sent.`,
      data: customerDto,
    };
  }
}
