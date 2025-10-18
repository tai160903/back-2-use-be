import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { UpdateFeaturesDto } from './dto/update-features.dto';

@Controller('subscriptions')
@ApiTags('Subscriptions')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles(['admin']))
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  @ApiBody({ type: CreateSubscriptionDto })
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions' })
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subscription by id' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  // Subscription features
  @Get('/features')
  @ApiOperation({ summary: 'Get subscription features' })
  findFeatures() {
    return this.subscriptionsService.findFeatures();
  }

  @Put('/features')
  @ApiOperation({ summary: 'Update subscription features' })
  @ApiBody({ type: UpdateFeaturesDto })
  updateFeatures(@Body() featuresDto: UpdateFeaturesDto) {
    return this.subscriptionsService.updateFeatures(featuresDto.features);
  }
  @Delete('/features/:feature')
  @ApiOperation({ summary: 'Delete subscription feature' })
  @ApiParam({ name: 'feature', type: String })
  removeFeature(@Param('feature') feature: string) {
    return this.subscriptionsService.removeFeature(feature);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a subscription' })
  @ApiParam({ name: 'id', type: String })
  update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(id, updateSubscriptionDto);
  }

  @Patch('delete/:id')
  @ApiOperation({ summary: 'Delete a subscription' })
  @ApiParam({ name: 'id', type: String })
  delete(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }
}
