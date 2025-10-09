import { isValidObjectId, Model } from 'mongoose';
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

@Injectable()
export class AdminCustomerService {
  constructor(
    @InjectModel(Users.name) private readonly userModel: Model<UsersDocument>,
    @InjectModel(UserBlockHistory.name)
    private readonly userBlockHistoryModel: Model<UserBlockHistoryDocument>,
    private mailerService: MailerService,
  ) {}

  projection =
    '_id name email phone address yob role isActive isBlocked createdAt updatedAt';

  // Admin get all users with role customer
  async getAllCustomers(
    query: GetCustomerQueryDto,
  ): Promise<APIPaginatedResponseDto<UserResponseDto[]>> {
    const { isBlocked, page = 1, limit = 10 } = query;

    const filter: any = { role: RolesEnum.CUSTOMER };
    if (isBlocked !== undefined) {
      filter.isBlocked = isBlocked;
    }

    const { data, total, currentPage, totalPages } =
      await paginate<UsersDocument>(
        this.userModel,
        filter,
        page,
        limit,
        this.projection,
      );

    const userDtos = data.map((user) =>
      plainToInstance(UserResponseDto, user.toObject()),
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Customers retrieved successfully',
      data: userDtos,
      total,
      currentPage,
      totalPages,
    };
  }

  // Admin get customer by id
  async getCustomerById(id: string): Promise<APIResponseDto<UserResponseDto>> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid User ID '${id}'`);
    }

    const user = await this.userModel
      .findById(id)
      .select(this.projection)
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    const userDto = plainToInstance(UserResponseDto, user.toObject());

    return {
      statusCode: HttpStatus.OK,
      message: `Customer with id '${id}' retrieved successfully`,
      data: userDto,
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

    const customer = await this.userModel
      .findOne({ _id: id, role: RolesEnum.CUSTOMER })
      .select(this.projection);

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (customer.isBlocked === isBlocked) {
      return {
        statusCode: HttpStatus.OK,
        message: `Customer is already ${isBlocked ? 'blocked' : 'unblocked'}`,
      };
    }

    customer.isBlocked = isBlocked;
    await customer.save();

    await this.userBlockHistoryModel.create({
      userId: customer._id,
      reason,
      isBlocked,
      blockBy: adminId || null,
    });

    const html = blockNotificationTemplate(customer.name, isBlocked, reason);

    const mailer: MailerDto = {
      to: [{ name: customer.name, address: customer.email }],
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
