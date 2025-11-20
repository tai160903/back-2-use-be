import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateSystemSettingDto } from '../dto/admin-system-setting/create-system-setting.dto';
import { UpdateSystemSettingDto } from '../dto/admin-system-setting/update-system-setting.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { SystemSetting } from 'src/modules/system-settings/schemas/system-setting.schema';
import { PatchValueDto } from '../dto/admin-system-setting/patch-value.dto';

@Injectable()
export class AdminSystemSettingService {
  constructor(
    @InjectModel(SystemSetting.name)
    private readonly systemSettingModel: Model<SystemSetting>,
  ) {}

  // ---------------- UPSERT ----------------
  async upsert(
    dto: CreateSystemSettingDto,
    adminId: string,
  ): Promise<APIResponseDto<SystemSetting>> {
    const { category, key } = dto;

    const updated = await this.systemSettingModel.findOneAndUpdate(
      { category, key },
      { ...dto, updatedBy: new Types.ObjectId(adminId) },
      { upsert: true, new: true },
    );

    return {
      statusCode: HttpStatus.OK,
      message: `Upsert system setting '${category}.${key}' successfully`,
      data: updated,
    };
  }

  // ---------------- GET ALL ----------------
  async findAll(): Promise<APIResponseDto<SystemSetting[]>> {
    const settings = await this.systemSettingModel
      .find()
      .sort({ category: 1, key: 1 });

    return {
      statusCode: HttpStatus.OK,
      message: 'Get all system settings successfully',
      data: settings,
    };
  }

  // ---------------- GET ONE ----------------
  async findOne(
    category: string,
    key: string,
  ): Promise<APIResponseDto<SystemSetting>> {
    const setting = await this.systemSettingModel.findOne({ category, key });

    if (!setting) {
      throw new NotFoundException(
        `System setting '${category}.${key}' not found`,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      message: `Get system setting '${category}.${key}' successfully`,
      data: setting,
    };
  }

  // ---------------- UPDATE ----------------
  async update(
    category: string,
    key: string,
    dto: UpdateSystemSettingDto,
    adminId: string,
  ): Promise<APIResponseDto<SystemSetting>> {
    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'At least one of value or description must be provided',
      );
    }

    const updated = await this.systemSettingModel.findOneAndUpdate(
      { category, key },
      { ...dto, updatedBy: new Types.ObjectId(adminId) },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException(
        `System setting '${category}.${key}' not found`,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      message: `Updated system setting '${category}.${key}' successfully`,
      data: updated,
    };
  }

  // ---------------- PATCH VALUE FIELD ----------------
  async patchValueField(
    category: string,
    key: string,
    dto: PatchValueDto,
    adminId: string,
  ): Promise<APIResponseDto<SystemSetting>> {
    const setting = await this.systemSettingModel.findOne({ category, key });
    if (!setting) {
      throw new NotFoundException(
        `System setting '${category}.${key}' not found`,
      );
    }

    setting.value[dto.path] = dto.value;
    setting.updatedBy = new Types.ObjectId(adminId);

    setting.markModified('value');

    await setting.save();

    return {
      statusCode: HttpStatus.OK,
      message: `Updated value field '${dto.path}' of '${category}.${key}'`,
      data: setting,
    };
  }

  // ---------------- DELETE VALUE FIELD ----------------
  async deleteValueField(
    category: string,
    key: string,
    field: string,
    adminId: string,
  ): Promise<APIResponseDto<SystemSetting>> {
    const setting = await this.systemSettingModel.findOne({ category, key });
    if (!setting) {
      throw new NotFoundException(
        `System setting '${category}.${key}' not found`,
      );
    }

    if (!setting.value.hasOwnProperty(field)) {
      throw new NotFoundException(
        `Field '${field}' does not exist in '${category}.${key}'.value`,
      );
    }

    delete setting.value[field];
    setting.updatedBy = new Types.ObjectId(adminId);

    setting.markModified('value');

    await setting.save();

    return {
      statusCode: HttpStatus.OK,
      message: `Deleted field '${field}' from '${category}.${key}'`,
      data: setting,
    };
  }
}
