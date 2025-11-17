import { Controller, Get } from '@nestjs/common';
import { AdminLeaderboardPolicyService } from '../services/admin-leaderboard-policy.service';

@Controller('')
export class AdminLeaderboardPolicyController {
  constructor(
    private readonly leaderboardPolicyService: AdminLeaderboardPolicyService,
  ) {}
}
