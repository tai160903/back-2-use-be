import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemSetting } from 'src/modules/system-settings/schemas/system-setting.schema';

@Injectable()
export class ValidateDamageIssuePipe implements PipeTransform {
  constructor(
    @InjectModel(SystemSetting.name)
    private readonly systemSettingsModel: Model<SystemSetting>,
  ) {}

  async transform(dto: any) {
    // Load policy từ DB
    const damagePolicy = await this.systemSettingsModel.findOne({
      category: 'return_check',
      key: 'damage_issues',
    });

    if (!damagePolicy || !damagePolicy.value) {
      throw new BadRequestException('Damage policy missing.');
    }

    const validIssues = Object.keys(damagePolicy.value); // ['scratch_light', 'broken', ...]

    // Map các field issue trong DTO
    const issues = [
      dto.frontIssue,
      dto.backIssue,
      dto.leftIssue,
      dto.rightIssue,
      dto.topIssue,
      dto.bottomIssue,
    ].filter(Boolean); // loại bỏ null

    // Validate từng issue
    for (const issue of issues) {
      if (!validIssues.includes(issue)) {
        throw new BadRequestException(
          `Invalid damage issue: ${issue}. Allowed: ${validIssues.join(', ')}`,
        );
      }
    }

    // Trả về dto nếu hợp lệ
    return dto;
  }
}
