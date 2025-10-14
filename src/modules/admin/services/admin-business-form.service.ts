import { Injectable } from '@nestjs/common';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
// import { CreateAdminDto } from './dto/create-admin.dto';
// import { UpdateAdminDto } from './dto/update-admin.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BusinessForm } from '../../businesses/schemas/business-form.schema';

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Businesses } from '../../businesses/schemas/businesses.schema';
import { Users } from '../../users/schemas/users.schema';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { BusinessFormStatusEnum } from 'src/common/constants/business-form-status.enum';
import { BusinessStatusEnum } from 'src/common/constants/business-status.enum';
import { MailerService } from 'src/infrastructure/mailer/mailer.service';
import {
  businessApprovedTemplate,
  businessRejectedTemplate,
} from 'src/infrastructure/mailer/templates/business-form.template';

@Injectable()
export class AdminBusinessFormService {
  constructor(
    @InjectModel(BusinessForm.name)
    private businessFormModel: Model<BusinessForm>,
    private mailerService: MailerService,
    @InjectModel(Users.name) private userModel: Model<Users>,
    @InjectModel(Businesses.name) private businessModel: Model<Businesses>,
  ) {}

  async approveBusiness(id: string): Promise<APIResponseDto> {
    const businessForm = await this.businessFormModel.findById(id);
    if (!businessForm) {
      return {
        statusCode: 404,
        message: 'Business form not found',
      };
    }
    businessForm.status = BusinessFormStatusEnum.APPROVED;
    await businessForm.save();

    const userEmail = businessForm.storeMail;
    const userName = businessForm.storeName;
    const randomPassword = crypto.randomBytes(8).toString('hex');
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(randomPassword, salt);

    let user = await this.userModel.findOne({ email: userEmail });

    if (!user) {
      user = new this.userModel({
        name: userName,
        email: userEmail,
        password: hashedPassword,
        isActive: true,
        role: RolesEnum.BUSINESS,
      });
      await user.save();
    }

    const now = new Date();
    const trailStartDate = now;
    const trailEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    let business = await this.businessModel.findOne({ userId: user._id });
    if (!business) {
      business = new this.businessModel({
        userId: user._id,
        status: BusinessStatusEnum.ACTIVE,
        trailStartDate,
        trailEndDate,
        storeName: businessForm.storeName,
        storeAddress: businessForm.storeAddress,
        storePhone: businessForm.storePhone,
        taxCode: businessForm.taxCode,
        foodSafetyCertUrl: businessForm.foodSafetyCertUrl,
        businessLicenseUrl: businessForm.businessLicenseUrl,
      });
      await business.save();
    }

    try {
      const mailResult = await this.mailerService.sendMail({
        to: [{ name: businessForm.storeName, address: businessForm.storeMail }],
        subject: 'Business Approved',
        html: businessApprovedTemplate(
          businessForm.storeName,
          userEmail,
          randomPassword,
          trailStartDate,
          trailEndDate,
        ),
      });
      if (!mailResult) {
        throw new Error('Failed to send approval email');
      }
    } catch (error) {
      return {
        statusCode: 500,
        message: `Business approved but failed to send email: ${error.message}`,
        data: businessForm,
      };
    }
    const { password: _, ...userData } = user.toObject();
    return {
      statusCode: 200,
      message: 'Business approved and email sent.',
      data: {
        businessForm,
        user: userData,
        business,
      },
    };
  }

  async rejectBusiness(id: string, note: string): Promise<APIResponseDto> {
    const businessForm = await this.businessFormModel.findById(id);
    if (!businessForm) {
      return {
        statusCode: 404,
        message: 'Business form not found',
      };
    }
    businessForm.status = BusinessFormStatusEnum.REJECTED;
    businessForm.rejectNote = note;
    await businessForm.save();

    try {
      const mailResult = await this.mailerService.sendMail({
        to: [{ name: businessForm.storeName, address: businessForm.storeMail }],
        subject: 'Business Rejected',
        html: businessRejectedTemplate(businessForm.storeName, note),
      });
      if (!mailResult) {
        throw new Error('Failed to send rejection email');
      }
    } catch (error) {
      return {
        statusCode: 500,
        message: `Business rejected but failed to send email: ${error.message}`,
        data: businessForm,
      };
    }
    return {
      statusCode: 200,
      message: 'Business rejected and email sent.',
      data: businessForm,
    };
  }
  // create(createAdminDto: CreateAdminDto) {
  //   return 'This action adds a new admin';
  // }
  // findAll() {
  //   return `This action returns all admin`;
  // }
  // findOne(id: number) {
  //   return `This action returns a #${id} admin`;
  // }
  // update(id: number, updateAdminDto: UpdateAdminDto) {
  //   return `This action updates a #${id} admin`;
  // }
  // remove(id: number) {
  //   return `This action removes a #${id} admin`;
  // }
}
