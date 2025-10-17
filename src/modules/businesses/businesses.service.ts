import { CreateBusinessFormDto } from './dto/create-business-form.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';
// import { CreateBusinessDto } from './dto/create-business.dto';
// import { UpdateBusinessDto } from './dto/update-business.dto';
import { Businesses } from './schemas/businesses.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { BusinessForm } from './schemas/business-form.schema';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectModel(Businesses.name) private businessesModel: Model<Businesses>,
    @InjectModel(BusinessForm.name)
    private businessFormModel: Model<BusinessForm>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getFormDetail(id: string): Promise<APIResponseDto> {
    try {
      const form = await this.businessesModel.findOne({ businessFormId: id });
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
      let message: string;
      if (error && (error as Error).message) {
        message = (error as Error).message;
      } else {
        message = String(error);
      }
      return {
        statusCode: 500,
        message: 'Error fetching business form detail',
        data: message,
      };
    }
  }

  async createForm(
    dto: CreateBusinessFormDto,
    files?: {
      businessLogo?: Express.Multer.File[];
      foodSafetyCertUrl?: Express.Multer.File[];
      businessLicenseFile?: Express.Multer.File[];
    },
  ): Promise<APIResponseDto> {
    const MAX_FILE_SIZE_MB = 5;
    try {
      // require files
      if (
        !files ||
        !files.businessLogo ||
        files.businessLogo.length === 0 ||
        !files.foodSafetyCertUrl ||
        files.foodSafetyCertUrl.length === 0 ||
        !files.businessLicenseFile ||
        files.businessLicenseFile.length === 0
      ) {
        return {
          statusCode: 400,
          message:
            'businessLogo, foodSafetyCertUrl, and businessLicenseFile are required.',
        };
      }

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf',
      ];
      const allowedLogoTypes = ['image/jpeg', 'image/png', 'image/jpg'];

      const businessLogoFile = files.businessLogo[0];
      const foodSafetyCertFile = files.foodSafetyCertUrl[0];
      const businessLicenseFile = files.businessLicenseFile[0];

      if (foodSafetyCertFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return {
          statusCode: 413,
          message: `File too large. Maximum allowed is ${MAX_FILE_SIZE_MB}MB`,
        };
      }
      if (businessLicenseFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return {
          statusCode: 413,
          message: `File too large. Maximum allowed is ${MAX_FILE_SIZE_MB}MB`,
        };
      }
      if (businessLogoFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return {
          statusCode: 413,
          message: `File too large. Maximum allowed is ${MAX_FILE_SIZE_MB}MB`,
        };
      }

      if (!allowedTypes.includes(foodSafetyCertFile.mimetype)) {
        return {
          statusCode: 400,
          message: 'foodSafetyCertUrl must be jpg, jpeg, png, or pdf',
        };
      }
      if (!allowedTypes.includes(businessLicenseFile.mimetype)) {
        return {
          statusCode: 400,
          message: 'businessLicenseFile must be jpg, jpeg, png, or pdf',
        };
      }
      if (!allowedLogoTypes.includes(businessLogoFile.mimetype)) {
        return {
          statusCode: 400,
          message: 'businessLogo must be jpg, jpeg, or png',
        };
      }

      // upload files to Cloudinary
      const logoRes = await this.cloudinaryService.uploadFile(
        businessLogoFile,
        'business/logos',
      );
      const foodSafetyRes = await this.cloudinaryService.uploadFile(
        foodSafetyCertFile,
        'business/forms',
      );
      const licenseRes = await this.cloudinaryService.uploadFile(
        businessLicenseFile,
        'business/forms',
      );

      const businessFormData = {
        ...dto,
        status: 'pending',
        businessLogoUrl: String(logoRes.secure_url),
        foodSafetyCertUrl: String(foodSafetyRes.secure_url),
        businessLicenseUrl: String(licenseRes.secure_url),
      };

      const business = new this.businessFormModel(businessFormData);
      await business.save();
      return {
        statusCode: 201,
        message: 'Business form created successfully',
        data: business,
      };
    } catch (err) {
      let message: string;
      if (err && (err as Error).message) {
        message = (err as Error).message;
      } else {
        message = String(err);
      }
      return {
        statusCode: 500,
        message: 'Error creating business form',
        data: message,
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
