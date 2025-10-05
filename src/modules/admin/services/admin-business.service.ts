// import { Model } from 'mongoose';
// import { Injectable, Inject } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';

// import { CreateUserDto } from './dto/create-user.dto';
// import { User } from './interfaces/users.interface';
// import { UserSchema } from './schemas/users.schema';

// @Injectable()
// export class AdminBusinessService {
//   constructor(
//     @InjectModel(UserSchema) private readonly userModel: Model<User>,
//   ) {}
//   async findAll() {
//     return await this.userModel.find().exec();
//   }
// }
