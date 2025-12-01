import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateFeedbackDto } from './create-feedback.dto';

// Omit borrowTransactionId because it cannot be changed after creation
export class UpdateFeedbackDto extends PartialType(
  OmitType(CreateFeedbackDto, ['borrowTransactionId'] as const),
) {}
