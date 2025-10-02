import { CreateBusinessFormDto } from './dto/create-business-form.dto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
// import { CreateBusinessDto } from './dto/create-business.dto';
// import { UpdateBusinessDto } from './dto/update-business.dto';
import { Businesses } from './schemas/businesses.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { BusinessForm } from './schemas/business-form.schema';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectModel(Businesses.name) private businessesModel: Model<Businesses>,
    @InjectModel(BusinessForm.name)
    private businessFormModel: Model<BusinessForm>,
  ) {}
  async createForm(dto: CreateBusinessFormDto) {
    try {
      const business = new this.businessFormModel({
        ...dto,
        status: 'pending',
      });
      await business.save();
      return business;
    } catch (error) {
      throw new HttpException(
        { message: 'Error creating business form', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  // create(createBusinessDto: CreateBusinessDto) {
  //   return 'This action adds a new business';
  // }

  // findAll() {
  //   return `This action returns all businesses`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} business`;
  // }

  // update(id: number, updateBusinessDto: UpdateBusinessDto) {
  //   return `This action updates a #${id} business`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} business`;
  // }
}
