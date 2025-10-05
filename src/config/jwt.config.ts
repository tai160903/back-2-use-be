import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET || 'default_access_secret',
    signOptions: { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h' },
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
    signOptions: { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' },
  },
}));
  