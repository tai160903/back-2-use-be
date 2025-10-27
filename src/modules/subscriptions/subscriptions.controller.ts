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
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions' })
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get('/features')
  @ApiOperation({ summary: 'Get subscription features' })
  findFeatures() {
    return this.subscriptionsService.findFeatures();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subscription by id' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  // Subscription features

  @Post()
  @ApiOperation({ summary: 'Create a subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  @ApiBody({ type: CreateSubscriptionDto })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles(['admin']))
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Put('/features')
  @ApiOperation({ summary: 'Update subscription features' })
  @ApiBody({ type: UpdateFeaturesDto })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles(['admin']))
  updateFeatures(@Body() featuresDto: UpdateFeaturesDto) {
    return this.subscriptionsService.updateFeatures(featuresDto.features);
  }

  @Delete('/features/:feature')
  @ApiOperation({ summary: 'Delete subscription feature' })
  @ApiParam({ name: 'feature', type: String })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles(['admin']))
  removeFeature(@Param('feature') feature: string) {
    return this.subscriptionsService.removeFeature(feature);
  }

  @Patch('delete/:id')
  @ApiOperation({ summary: 'Delete a subscription' })
  @ApiParam({ name: 'id', type: String })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles(['admin']))
  delete(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a subscription' })
  @ApiParam({ name: 'id', type: String })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles(['admin']))
  update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(id, updateSubscriptionDto);
  }
}
