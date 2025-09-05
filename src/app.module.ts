import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.DATABASE_URL as string, {
      user: process.env.DATABASE_USER,
      pass: process.env.DATABASE_PASSWORD,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
