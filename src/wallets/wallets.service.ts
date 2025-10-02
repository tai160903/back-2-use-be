import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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

  async create(createWalletDto: CreateWalletDto) {
    try {
      const { userId } = createWalletDto;
      const existingWallet = await this.walletsModel.findOne({
        user_id: userId,
      });
      if (existingWallet) {
        throw new HttpException(
          { message: 'Wallet already exists for this user' },
          HttpStatus.BAD_REQUEST,
        );
      }
      const wallet = new this.walletsModel({
        user_id: createWalletDto.userId,
        balance: 0,
      });
      await wallet.save();
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Wallet created successfully',
        data: wallet,
      };
    } catch (error) {
      throw new HttpException(
        { message: 'Error creating wallet', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // async findAll() {
  //   return await this.walletsModel.find();
  // }

  async findOne(id: string) {
    try {
      const wallet = await this.walletsModel.findById(id);
      return {
        statusCode: HttpStatus.OK,
        message: 'Wallet retrieved successfully',
        data: wallet,
      };
    } catch (error) {
      throw new HttpException(
        { message: 'Wallet not found', error: error.message },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async update(id: string, updateWalletDto: UpdateWalletDto) {
    try {
      const wallet = await this.walletsModel.findById(id);
      if (!wallet) {
        throw new HttpException(
          { message: 'Wallet not found' },
          HttpStatus.NOT_FOUND,
        );
      }
      if (updateWalletDto.balance !== undefined) {
        wallet.balance = updateWalletDto.balance;
      }
      await wallet.save();
      return {
        statusCode: HttpStatus.OK,
        message: 'Wallet updated successfully',
        data: wallet,
      };
    } catch (error) {
      throw new HttpException(
        { message: 'Error updating wallet', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // async remove(id: string) {
  //   return await this.walletsModel.findByIdAndDelete(id);
  // }
}
