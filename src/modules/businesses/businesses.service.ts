import { CreateBusinessFormDto } from './dto/create-business-form.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
// import { CreateBusinessDto } from './dto/create-business.dto';
// import { UpdateBusinessDto } from './dto/update-business.dto';
import { Businesses } from './schemas/businesses.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { BusinessForm } from './schemas/business-form.schema';
import { Injectable } from '@nestjs/common';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectModel(Businesses.name) private businessesModel: Model<Businesses>,
    @InjectModel(BusinessForm.name)
    private businessFormModel: Model<BusinessForm>,
  ) {}
  async createForm(dto: CreateBusinessFormDto): Promise<APIResponseDto> {
    try {
      const business = new this.businessFormModel({
        ...dto,
        status: 'pending',
      });
      await business.save();
      return {
        statusCode: 201,
        message: 'Business form created successfully',
        data: business,
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: 'Error creating business form',
        data: error.message,
      };
    }
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
        this.businessFormModel.find(query).skip(skip).limit(limit),
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
