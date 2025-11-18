import { Module } from '@nestjs/common';
import { MonthlyLeaderboardsController } from './monthly-leaderboard.controller';
import { MonthlyLeaderboardsService } from './monthly-leaderboard.service';
import {
  MonthlyLeaderboard,
  MonthlyLeaderboardSchema,
} from './schemas/monthly-leaderboards.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MonthlyLeaderboard.name, schema: MonthlyLeaderboardSchema },
    ]),
  ],
  controllers: [MonthlyLeaderboardsController],
  providers: [MonthlyLeaderboardsService],
})
export class MonthlyLeaderboardsModule {}
