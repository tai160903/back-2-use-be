import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { MonthlyLeaderboard } from 'src/modules/monthly-leaderboards/schemas/monthly-leaderboards.schema';
import { Customers } from 'src/modules/users/schemas/customer.schema';

@Injectable()
export class MonthlyLeaderboardService {
  private readonly logger = new Logger(MonthlyLeaderboardService.name);

  constructor(
    @InjectModel(MonthlyLeaderboard.name)
    private leaderboardModel: Model<MonthlyLeaderboard>,
    @InjectModel(Customers.name)
    private customersModel: Model<Customers>,
    @InjectConnection() private connection: Connection,
  ) {}

  /**
   * Chạy lúc 00:05 ngày đầu tiên mỗi tháng
   * Ví dụ: 01/12/2025 00:05 => chốt leaderboard tháng 11
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async createMonthlyLeaderboardCron() {
    const now = new Date();

    let year = now.getFullYear();
    let month = now.getMonth() + 1;

    if (month === 0) {
      month = 12;
      year = year - 1;
    }

    this.logger.log(`Cron Start: Locking leaderboard for ${month}/${year}`);

    await this.generateMonthlyLeaderboard(month, year);

    this.logger.log(`Cron Success: Leaderboard locked for ${month}/${year}`);
  }

  /**
   * Generate leaderboard snapshot
   */
  async generateMonthlyLeaderboard(month: number, year: number) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // 1. Check tồn tại chưa (chạy cron 2 lần sẽ bị lỗi)
      const existed = await this.leaderboardModel.findOne({ month, year });
      if (existed) {
        this.logger.warn(`Leaderboard ${month}/${year} already exists.`);
        await session.abortTransaction();
        return;
      }

      // 2. Lấy tất cả customers sort theo rankingPoints DESC
      const customers = await this.customersModel
        .find({ rankingPoints: { $gt: 0 } })
        .sort({ rankingPoints: -1 })
        .session(session);

      if (customers.length === 0) {
        this.logger.warn(`No customers with rankingPoints found.`);
      }

      // 3. Tạo danh sách leaderboard
      const leaderboardDocs = customers.map((cus, index) => ({
        customerId: cus._id,
        month,
        year,
        rankingPoints: cus.rankingPoints,
        rank: index + 1,
        lockedAt: new Date(),
      }));

      await this.leaderboardModel.insertMany(leaderboardDocs, { session });

      // 4. Reset rankingPoints về 0
      //   await this.customersModel.updateMany(
      //     {},
      //     { rankingPoints: 0 },
      //     { session },
      //   );

      // 5. Commit
      await session.commitTransaction();
    } catch (e) {
      this.logger.error('Generate monthly leaderboard failed', e);
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }
}
