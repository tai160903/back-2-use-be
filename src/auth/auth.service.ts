import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthDto } from './dto/auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Users } from 'src/users/schemas/users.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Users.name) private usersModel: Model<Users>,
    private jwtService: JwtService,
  ) {}

  async register(authDto: AuthDto) {
    const existingUser = await this.usersModel.findOne({
      email: authDto.email,
    });
    if (existingUser) {
      throw new HttpException(
        { message: 'Email already exists' },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (authDto.password !== authDto.confirmPassword) {
      throw new HttpException(
        { message: 'Passwords do not match' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(authDto.password, salt);
    authDto.password = hashedPassword;
    delete authDto.confirmPassword;

    const createdUser = new this.usersModel(authDto);
    await createdUser.save();
    return {
      statusCode: HttpStatus.CREATED,
      message: 'User registered successfully',
      data: createdUser,
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersModel.findOne({ email });
    if (!user) {
      throw new HttpException(
        { message: 'Invalid email or password' },
        HttpStatus.UNAUTHORIZED,
      );
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new HttpException(
        { message: 'Invalid email or password' },
        HttpStatus.UNAUTHORIZED,
      );
    }
    const payload = { email: user.email, sub: user._id };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data: { accessToken: accessToken, user: user },
    };
  }

  // async changePassword(changePasswordDto: {
  //   email: string;
  //   oldPassword: string;
  //   newPassword: string;
  // }) {
  //   const { email, oldPassword, newPassword } = changePasswordDto;
  //   const user = await this.usersModel.findOne({ email });
  //   if (!user) {
  //     throw new HttpException(
  //       { message: 'User not found' },
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }
  //   const isMatch = await bcrypt.compare(oldPassword, user.password);
  //   if (!isMatch) {
  //     throw new HttpException(
  //       { message: 'Invalid old password' },
  //       HttpStatus.UNAUTHORIZED,
  //     );
  //   }
  //   const salt = await bcrypt.genSalt();
  //   const hashedPassword = await bcrypt.hash(newPassword, salt);
  //   user.password = hashedPassword;
  //   await user.save();
  //   return {
  //     statusCode: HttpStatus.OK,
  //     message: 'Password changed successfully',
  //     data: user,
  //   };
  // }
}
