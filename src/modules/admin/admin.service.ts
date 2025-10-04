import { Injectable } from '@nestjs/common';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
// import { CreateAdminDto } from './dto/create-admin.dto';
// import { UpdateAdminDto } from './dto/update-admin.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BusinessForm } from './../businesses/schemas/business-form.schema';
import { MailerService } from '../mailer/mailer.service';
import {
  businessApprovedTemplate,
  businessRejectedTemplate,
} from '../mailer/templates/business-form.template';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(BusinessForm.name)
    private businessFormModel: Model<BusinessForm>,
    private mailerService: MailerService,
  ) {}

  async approveBusiness(id: string): Promise<APIResponseDto> {
    const businessForm = await this.businessFormModel.findById(id);
    if (!businessForm) {
      return {
        statusCode: 404,
        message: 'Business form not found',
      };
    }
    businessForm.status = 'approved';
    await businessForm.save();

    await this.mailerService.sendMail({
      to: [{ address: businessForm.storeMail, name: businessForm.storeName }],
      subject: 'Business Approved',
      html: businessApprovedTemplate(businessForm.storeName),
    });
    return {
      statusCode: 200,
      message: 'Business approved and email sent.',
      data: businessForm,
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
    businessForm.status = 'rejected';
    businessForm.rejectNote = note;
    await businessForm.save();

    await this.mailerService.sendMail({
      to: [{ address: businessForm.storeMail, name: businessForm.storeName }],
      subject: 'Business Rejected',
      html: businessRejectedTemplate(businessForm.storeName, note),
    });
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
