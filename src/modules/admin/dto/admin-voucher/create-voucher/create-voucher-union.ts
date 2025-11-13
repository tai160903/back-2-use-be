import { CreateBusinessVoucherDto } from './create-business-voucher.dto';
import { CreateLeaderboardVoucherDto } from './create-leaderboard-voucher.dto';
// import { CreateSystemVoucherDto } from './create-system-voucher.dto';

export type CreateVoucherUnion =
  CreateBusinessVoucherDto | CreateLeaderboardVoucherDto;
