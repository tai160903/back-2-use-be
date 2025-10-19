import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { UserBlockHistory } from './schemas/users-block-history';
import { GetUserBlockHistoryQueryDto } from './dto/get-user-block-history-query.dto';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @UseGuards(
    AuthGuard('jwt'),
    RoleCheckGuard.withRoles(['customer', 'business']),
  )
  findMe(@Request() req: any) {
    return this.usersService.findMe(req.user._id);
  }

  @Put('edit-profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated' })
  @UseGuards(AuthGuard('jwt'), RoleCheckGuard.withRoles(['customer']))
  updateMe(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateMe(req.user._id, updateUserDto);
  }

  // GET users/:id/block-history
  @Get(':id/block-history')
  @ApiParam({ name: 'id', description: 'User ID' })
  async getUserBlockHistory(
    @Param('id') id: string,
    @Query() query: GetUserBlockHistoryQueryDto,
  ): Promise<APIPaginatedResponseDto<UserBlockHistory[]>> {
    return this.usersService.getUserBlockHistory(id, query);
  }

  @Put('edit-avatar')
  @UseInterceptors(
    FileInterceptor('avatar', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiOperation({ summary: 'Update current user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseGuards(
    AuthGuard('jwt'),
    RoleCheckGuard.withRoles(['customer', 'business']),
  )
  async updateAvatar(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.updateAvatar(req.user._id, file);
  }
}
