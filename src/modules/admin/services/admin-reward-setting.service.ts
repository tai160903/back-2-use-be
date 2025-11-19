import { Model } from 'mongoose';
import { Injectable, Inject, HttpStatus, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  RewardSetting,
  RewardSettingDocument,
} from 'src/modules/reward-settings/schema/reward-setting.schema';
import { AdminCreateRewardSettingDto } from '../dto/admin-reward-setting/create-reward-setting.dto';
import { AdminUpdateRewardSettingDto } from '../dto/admin-reward-setting/update-reward-setting.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';

@Injectable()
export class AdminRewardSettingService {
  constructor(
    @InjectModel(RewardSetting.name)
    private readonly rewardSettingModel: Model<RewardSetting>,
  ) {}

  // CREATE
  async create(
    dto: AdminCreateRewardSettingDto,
  ): Promise<APIResponseDto<RewardSetting>> {
    const created = await this.rewardSettingModel.create({
      ...dto,
      isActive: true,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Create reward setting successfully',
      data: created,
    };
  }

  // GET (paginate)
  async getActive(): Promise<APIResponseDto<RewardSetting>> {
    const setting = await this.rewardSettingModel.findOne({ isActive: true });

    if (!setting) {
      throw new HttpException(
        'No active reward setting found',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Get active reward setting successfully',
      data: setting,
    };
  }

  // UPDATE
  async update(
    id: string,
    dto: AdminUpdateRewardSettingDto,
  ): Promise<APIResponseDto<RewardSetting>> {
    const updated = await this.rewardSettingModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    );

    if (!updated) {
      throw new HttpException('Reward setting not found', HttpStatus.NOT_FOUND);
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Update reward setting successfully',
      data: updated,
    };
  }

  // TOGGLE ACTIVE
  async toggleActive(id: string): Promise<APIResponseDto<RewardSetting>> {
    const setting = await this.rewardSettingModel.findById(id);

    if (!setting) {
      throw new HttpException('Reward setting not found', HttpStatus.NOT_FOUND);
    }

    setting.isActive = !setting.isActive;
    await setting.save();

    return {
      statusCode: HttpStatus.OK,
      message: `Reward setting is now ${setting.isActive ? 'active' : 'inactive'}`,
      data: setting,
    };
  }
}
