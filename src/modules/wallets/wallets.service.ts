import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallets } from './schemas/wallets.schema';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallets.name) private walletsModel: Model<Wallets>,
  ) {}

  async create(createWalletDto: CreateWalletDto): Promise<APIResponseDto> {
    try {
      const { userId } = createWalletDto;
      const existingWallet = await this.walletsModel.findOne({
        user_id: userId,
      });
      if (existingWallet) {
        return {
          statusCode: 400,
          message: 'Wallet already exists for this user',
        };
      }
      const wallet = new this.walletsModel({
        user_id: createWalletDto.userId,
        balance: 0,
      });
      await wallet.save();
      return {
        statusCode: 201,
        message: 'Wallet created successfully',
        data: wallet,
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: 'Error creating wallet',
        data: error.message,
      };
    }
  }

  // async findAll() {
  //   return await this.walletsModel.find();
  // }

  async findOne(id: string): Promise<APIResponseDto> {
    try {
      const wallet = await this.walletsModel.findById(id);
      if (!wallet) {
        return {
          statusCode: 404,
          message: 'Wallet not found',
        };
      }
      return {
        statusCode: 200,
        message: 'Wallet retrieved successfully',
        data: wallet,
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: 'Error retrieving wallet',
        data: error.message,
      };
    }
  }

  async update(
    id: string,
    updateWalletDto: UpdateWalletDto,
  ): Promise<APIResponseDto> {
    try {
      const wallet = await this.walletsModel.findById(id);
      if (!wallet) {
        return {
          statusCode: 404,
          message: 'Wallet not found',
        };
      }
      if (updateWalletDto.balance !== undefined) {
        wallet.balance = updateWalletDto.balance;
      }
      await wallet.save();
      return {
        statusCode: 200,
        message: 'Wallet updated successfully',
        data: wallet,
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: 'Error updating wallet',
        data: error.message,
      };
    }
  }

  // async remove(id: string) {
  //   return await this.walletsModel.findByIdAndDelete(id);
  // }
}
