import { Model } from 'mongoose';
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  LeaderboardRewardPolicy,
  LeaderboardRewardPolicyDocument,
} from 'src/modules/leaderboard-reward-policies/schema/leaderboard-reward-policies.schema';

@Injectable()
export class AdminLeaderboardPolicyService {
  constructor(
    @InjectModel(LeaderboardRewardPolicy.name)
    private readonly leaderboardPolicyModel: Model<LeaderboardRewardPolicyDocument>,
  ) {}
}
