import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
    try {
      console.log('ud', id);
      const businessForm = await this.businessFormModel.findById(id);
      console.log('businessForm', businessForm);
      if (!businessForm) {
        return {
          statusCode: 404,
          message: 'Business form not found',
        };
      }
      businessForm.status = BusinessFormStatusEnum.APPROVED;
      await businessForm.save();

      const userEmail = businessForm.businessMail;
      const baseUsername = businessForm.businessName
        .toLowerCase()
        .replace(/\s+/g, '') // bỏ khoảng trắng
        .replace(/[^a-z0-9]/g, ''); // chỉ giữ chữ và số

      const randomSuffix = Math.floor(1000 + Math.random() * 9000); // số 4 chữ số
      const generatedUsername = `${baseUsername}${randomSuffix}`;

      const randomPassword = crypto.randomBytes(8).toString('hex');
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      let user = await this.userModel.findOne({ email: userEmail });

      if (!user) {
        user = new this.userModel({
          username: generatedUsername,
          email: userEmail,
          password: hashedPassword,
          isActive: true,
          role: RolesEnum.BUSINESS,
        });
        await user.save();
      }

      const now = new Date();
      // const trailStartDate = now;
      // const trailEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      let business = await this.businessModel.findOne({ userId: user._id });
      if (!business) {
        business = new this.businessModel({
          userId: user._id,
          businessFormId: businessForm._id,
          status: BusinessStatusEnum.ACTIVE,
          businessName: businessForm.businessName,
          businessAddress: businessForm.businessAddress,
          businessPhone: businessForm.businessPhone,
          taxCode: businessForm.taxCode,
          businessType: businessForm.businessType,
          businessLogoUrl: businessForm.businessLogoUrl,
          foodSafetyCertUrl: businessForm.foodSafetyCertUrl,
          businessLicenseUrl: businessForm.businessLicenseUrl,
        });
        await business.save();
      }

      const mailResult = await this.mailerService
        .sendMail({
          to: [
            {
              name: businessForm.businessName,
              address: businessForm.businessMail,
            },
          ],
          subject: 'Business Approved',
          html: businessApprovedTemplate(
            businessForm.businessName,
            userEmail,
            generatedUsername,
            randomPassword,
          ),
        })
        .catch((error) => {
          throw new HttpException(
            error.message || 'Failed to send approval email',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        });
      if (!mailResult) {
        throw new HttpException(
          'Failed to send approval email',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
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
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
    businessForm.status = BusinessFormStatusEnum.REJECTED;
    businessForm.rejectNote = note;
    await businessForm.save();

    try {
      const mailResult = await this.mailerService.sendMail({
        to: [
          {
            name: businessForm.businessName,
            address: businessForm.businessMail,
          },
        ],
        subject: 'Business Rejected',
        html: businessRejectedTemplate(businessForm.businessName, note),
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
