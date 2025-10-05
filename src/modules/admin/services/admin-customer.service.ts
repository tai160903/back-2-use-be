import { Model } from 'mongoose';
import {
  Injectable,
  Inject,
  HttpStatus,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Users, UsersDocument } from 'src/modules/users/schemas/users.schema';
import { GetCustomerQueryDto } from '../dto/admin-customer/get-customers-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { paginate } from 'src/common/utils/pagination.util';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';

@Injectable()
export class AdminCustomerService {
  constructor(
    @InjectModel(Users.name) private readonly userModel: Model<UsersDocument>,
  ) {}

  // Admin get all users with role customer
  async getAllCustomers(
    query: GetCustomerQueryDto,
  ): Promise<APIPaginatedResponseDto<Users[]>> {
    const { isBlocked, page = 1, limit = 10 } = query;

    const filter: any = { role: 'customer' };
    if (isBlocked !== undefined) {
      filter.isBlocked = isBlocked;
    }

    const { data, total, currentPage, totalPages } =
      await paginate<UsersDocument>(
        this.userModel,
        filter,
        page,
        limit,
        '_id name email phone address yob role isActive isBlocked createdAt updatedAt',
      );

    return {
      statusCode: HttpStatus.OK,
      message: 'Customer retrieved successfully',
      data,
      total,
      currentPage,
      totalPages,
    };
  }

  // Admin update block status
  async updateBlockStatus(
    id: string,
    isBlocked: boolean,
  ): Promise<APIResponseDto<Users>> {
    const customer = await this.userModel
      .findOne({ _id: id, role: 'customer' })
      .select(
        '_id name email phone address yob role isActive isBlocked createdAt updatedAt',
      );

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

    return {
      statusCode: HttpStatus.OK,
      message: `Customer has been ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: customer,
    };
  }
}
