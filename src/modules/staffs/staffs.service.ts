import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Staff } from './schemas/staffs.schema';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Businesses } from '../businesses/schemas/businesses.schema';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { aggregatePaginate } from 'src/common/utils/aggregate-pagination.util';
import { Users } from '../users/schemas/users.schema';
import { RolesEnum } from 'src/common/constants/roles.enum';
import * as bcrypt from 'bcrypt';
import { generateRandomString } from 'src/common/utils/generate-random-string.util';
import { MailerService } from 'src/infrastructure/mailer/mailer.service';
import { staffCredentialsTemplate } from 'src/infrastructure/mailer/templates/staff-credentials.template';

@Injectable()
export class StaffsService {
  constructor(
    @InjectModel(Staff.name) private staffModel: Model<Staff>,
    @InjectModel(Businesses.name) private businessesModel: Model<Businesses>,
    @InjectModel(Users.name) private usersModel: Model<Users>,
    private readonly mailerService: MailerService,
  ) {}

  async createStaff(
    dto: CreateStaffDto,
    businessUserId: string,
  ): Promise<APIResponseDto> {
    try {
      const business = await this.businessesModel.findOne({
        userId: new Types.ObjectId(businessUserId),
      });
      if (!business)
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);

      if (dto.businessId.toString() !== business._id.toString()) {
        throw new HttpException('Mismatched businessId', HttpStatus.FORBIDDEN);
      }

      const existing = await this.staffModel.findOne({
        businessId: business._id,
        email: dto.email.toLowerCase(),
      });
      if (existing)
        throw new HttpException(
          'Staff with this email already exists',
          HttpStatus.BAD_REQUEST,
        );

      const emailLower = dto.email.toLowerCase();
      const existingUser = await this.usersModel
        .findOne({ email: emailLower })
        .select('+password');
      if (existingUser) {
        throw new HttpException(
          'User email already exists',
          HttpStatus.BAD_REQUEST,
        );
      }

      const baseUsernameRaw = emailLower.split('@')[0];
      let candidate = baseUsernameRaw;
      let suffix = 1;
      while (await this.usersModel.findOne({ username: candidate })) {
        candidate = `${baseUsernameRaw}${suffix++}`;
      }

      const tempPasswordPlain = generateRandomString(10);
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(tempPasswordPlain, salt);

      const user = new this.usersModel({
        username: candidate,
        email: emailLower,
        password: hashedPassword,
        role: RolesEnum.STAFF,
        isActive: true,
      });
      await user.save();

      const staff = await this.staffModel.create({
        businessId: business._id,
        fullName: dto.fullName,
        email: emailLower,
        phone: dto.phone,
        status: 'active', // immediately active since account created
        userId: user._id,
      });

      // Send credentials via email instead of returning password in API
      try {
        const subject = 'Tài khoản nhân viên đã được tạo';
        const html = staffCredentialsTemplate({
          fullName: staff.fullName,
          username: user.username,
          tempPassword: tempPasswordPlain,
        });
        await this.mailerService.sendMail({
          to: [{ name: staff.fullName || emailLower, address: emailLower }],
          subject,
          html,
        });
      } catch (_e) {
        // Do not fail creation if email fails; log or swallow
        console.warn('Failed to send staff credentials email', _e);
      }

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Staff created successfully; credentials sent via email',
        data: {
          staff,
          credentialsSent: true,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        (error as Error).message || 'Error creating staff',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAllStaffs(
    businessUserId: string,
    query: { page?: number; limit?: number; search?: string; status?: string },
  ): Promise<APIResponseDto> {
    try {
      const business = await this.businessesModel.findOne({
        userId: new Types.ObjectId(businessUserId),
      });
      if (!business)
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);

      const page = query.page && query.page > 0 ? query.page : 1;
      const limit = query.limit && query.limit > 0 ? query.limit : 10;

      const match: any = { businessId: business._id };
      if (query.status) match.status = query.status;
      if (query.search) {
        match.$or = [
          { fullName: { $regex: query.search, $options: 'i' } },
          { email: { $regex: query.search, $options: 'i' } },
        ];
      }

      const pipeline = [{ $match: match }];
      const paginated = await aggregatePaginate(
        this.staffModel,
        pipeline,
        page,
        limit,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Staff list fetched successfully',
        data: paginated,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        (error as Error).message || 'Error fetching staff list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOneStaff(
    businessUserId: string,
    staffId: string,
  ): Promise<APIResponseDto> {
    try {
      const business = await this.businessesModel.findOne({
        userId: new Types.ObjectId(businessUserId),
      });
      if (!business)
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);

      const staff = await this.staffModel.findOne({
        _id: new Types.ObjectId(staffId),
        businessId: business._id,
      });
      if (!staff)
        throw new HttpException('Staff not found', HttpStatus.NOT_FOUND);

      return {
        statusCode: HttpStatus.OK,
        message: 'Staff fetched successfully',
        data: staff,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Error fetching staff',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateStaff(
    businessUserId: string,
    staffId: string,
    dto: UpdateStaffDto,
  ): Promise<APIResponseDto> {
    try {
      const business = await this.businessesModel.findOne({
        userId: new Types.ObjectId(businessUserId),
      });
      if (!business)
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);

      const staff = await this.staffModel.findOne({
        _id: new Types.ObjectId(staffId),
        businessId: business._id,
      });
      if (!staff)
        throw new HttpException('Staff not found', HttpStatus.NOT_FOUND);

      if (dto.email) {
        const duplicate = await this.staffModel.findOne({
          businessId: business._id,
          email: dto.email.toLowerCase(),
          _id: { $ne: staff._id },
        });
        if (duplicate)
          throw new HttpException(
            'Another staff with this email exists',
            HttpStatus.BAD_REQUEST,
          );
        staff.email = dto.email.toLowerCase();
      }
      if (dto.fullName) staff.fullName = dto.fullName;
      if (dto.phone) staff.phone = dto.phone;
      if (dto.status) staff.status = dto.status;

      await staff.save();

      return {
        statusCode: HttpStatus.OK,
        message: 'Staff updated successfully',
        data: staff,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        (error as Error).message || 'Error updating staff',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async removeStaff(
    businessUserId: string,
    staffId: string,
  ): Promise<APIResponseDto> {
    try {
      const business = await this.businessesModel.findOne({
        userId: new Types.ObjectId(businessUserId),
      });
      if (!business)
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);

      const staff = await this.staffModel.findOne({
        _id: new Types.ObjectId(staffId),
        businessId: business._id,
      });
      if (!staff)
        throw new HttpException('Staff not found', HttpStatus.NOT_FOUND);

      staff.status = 'removed';
      await staff.save();

      return {
        statusCode: HttpStatus.OK,
        message: 'Staff removed successfully',
        data: { staffId: staff._id },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        (error as Error).message || 'Error removing staff',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
