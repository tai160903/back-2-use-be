import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users, UsersDocument } from './schemas/users.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Users.name) private usersModel: Model<UsersDocument>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.usersModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new HttpException(
        { message: 'Email already exists' },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (createUserDto.password !== createUserDto.confirmPassword) {
      throw new HttpException(
        { message: 'Passwords do not match' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
    createUserDto.password = hashedPassword;
    delete createUserDto.confirmPassword;

    const createdUser = new this.usersModel(createUserDto);
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
    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data: user,
    };
  }

  findAll() {
    return this.usersModel.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
