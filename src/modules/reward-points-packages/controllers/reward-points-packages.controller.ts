import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiQuery,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { RewardPointsPackagesService } from '../services/reward-points-packages.service';
import { CreateRewardPointsPackageDto } from '../dto/create-reward-points-package.dto';
import { UpdateRewardPointsPackageDto } from '../dto/update-reward-points-package.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';

@ApiTags('Reward Points Packages')
@Controller('reward-points-packages')
export class RewardPointsPackagesController {
  constructor(private readonly service: RewardPointsPackagesService) {}

  // ============ ADMIN ENDPOINTS ============

  @Post('admin/create')
  @UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.ADMIN]))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create reward points package',
    description:
      'Admin only: Create a new reward points package that can be purchased by businesses',
  })
  @ApiResponse({
    status: 201,
    description: 'Reward points package created successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admin can access',
  })
  async createPackage(@Body() dto: CreateRewardPointsPackageDto) {
    return this.service.createPackage(dto);
  }

  @Patch('admin/:id')
  @UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.ADMIN]))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update reward points package',
    description: 'Admin only: Update an existing reward points package details',
  })
  @ApiParam({
    name: 'id',
    description: 'Package ID',
    example: '65f1a2b3c4d5e6f7g8h9i0j1',
  })
  @ApiResponse({
    status: 200,
    description: 'Reward points package updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Package not found',
  })
  async updatePackage(
    @Param('id') id: string,
    @Body() dto: UpdateRewardPointsPackageDto,
  ) {
    return this.service.updatePackage(id, dto);
  }

  @Get('admin/all')
  @UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.ADMIN]))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get all reward points packages',
    description:
      'Admin only: Retrieve all reward points packages with pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Packages retrieved successfully',
  })
  async getPackages(
    @Query('page', new ParseIntPipe()) page: number = 1,
    @Query('limit', new ParseIntPipe()) limit: number = 10,
  ) {
    return this.service.getPackages(page, limit);
  }

  @Delete('admin/:id')
  @UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.ADMIN]))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Delete reward points package',
    description: 'Admin only: Soft delete a reward points package',
  })
  @ApiParam({
    name: 'id',
    description: 'Package ID',
    example: '65f1a2b3c4d5e6f7g8h9i0j1',
  })
  @ApiResponse({
    status: 200,
    description: 'Package deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Package not found',
  })
  async deletePackage(@Param('id') id: string) {
    return this.service.deletePackage(id);
  }

  // ============ BUSINESS ENDPOINTS ============

  @Get('active')
  @ApiOperation({
    summary: 'Get active reward points packages',
    description:
      'Retrieve all active reward points packages available for purchase',
  })
  @ApiResponse({
    status: 200,
    description: 'Active packages retrieved successfully',
  })
  async getActivePackages() {
    return this.service.getActivePackages();
  }

  @Post('buy/:packageId')
  @UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.BUSINESS]))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Buy reward points package',
    description:
      'Business only: Purchase a reward points package using wallet balance',
  })
  @ApiParam({
    name: 'packageId',
    description: 'Package ID to purchase',
    example: '65f1a2b3c4d5e6f7g8h9i0j1',
  })
  @ApiResponse({
    status: 200,
    description: 'Package purchased successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid package or insufficient wallet balance',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only business can purchase',
  })
  async buyPackage(@Param('packageId') packageId: string, @Request() req: any) {
    const userId = req.user._id;
    return this.service.buyRewardPointsPackage(userId, packageId);
  }

  @Get('my-info')
  @UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.BUSINESS]))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get my reward points information',
    description:
      'Business only: Retrieve current reward points balance and usage statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Reward points information retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Business reward points info fetched successfully',
        data: {
          currentRewardPoints: 100,
          maxRewardPoints: 500,
          usedRewardPoints: 400,
          percentageUsed: 80,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only business can access',
  })
  async getMyRewardPointsInfo(@Request() req: any) {
    const userId = req.user.userId;
    return this.service.getBusinessRewardPointsInfo(userId);
  }

  @Get('purchase-history')
  @UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.BUSINESS]))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get reward points purchase history',
    description:
      'Business only: Retrieve purchase history of reward points packages',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase history retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Reward points purchase history fetched successfully',
        data: [
          {
            id: '65f1a2b3c4d5e6f7g8h9i0j1',
            transactionDate: '2025-12-28T10:30:00.000Z',
            amount: 500000,
            description: 'Purchase Premium 5000 points (5000 points)',
            status: 'completed',
            packageInfo: {
              id: '65f1a2b3c4d5e6f7g8h9i0j2',
              name: 'Premium 5000 points',
              points: 5000,
              price: 500000,
            },
          },
        ],
        total: 1,
        currentPage: 1,
        totalPages: 1,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only business can access',
  })
  async getPurchaseHistory(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    return this.service.getRewardPointsPurchaseHistory(userId, page, limit);
  }
}
