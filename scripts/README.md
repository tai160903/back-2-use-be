# Database Scripts

This directory contains database management scripts for the Back2Use backend application.

## Available Scripts

### Seed Script

The seed script populates your MongoDB database with initial test data for development and testing purposes.

#### What Gets Seeded

The seed script creates the following data:

1. **Users** (5 users)

   - 1 Admin user
   - 2 Regular customers
   - 2 Business owners

2. **Materials** (4 types)

   - Stainless Steel
   - Glass
   - Food-Grade Plastic
   - Bamboo Fiber

3. **Subscriptions** (4 plans)

   - Free Trial (30 days, 2 product groups, 20 items)
   - Basic Plan (199,000 VND/month)
   - Pro Plan (499,000 VND/month)
   - Enterprise Plan (999,000 VND/month, unlimited)

4. **Businesses** (2 establishments)

   - Green Cafe
   - Eco Food Market

5. **Product Groups** (4 groups)

   - Coffee Cup - Medium
   - Smoothie Glass
   - Food Container
   - Bamboo Bowl

6. **Product Sizes** (5 sizes with different configurations)

7. **Products** (51 individual items)

   - 10 Small coffee cups
   - 8 Large coffee cups
   - 6 Smoothie glasses
   - 15 Food containers
   - 12 Bamboo bowls

8. **Vouchers** (4 promotional vouchers)

9. **Wallets** (4 user wallets with initial balances)

10. **System Settings** (3 configuration entries)

#### How to Run

**Prerequisites:**

- MongoDB must be running
- Set `DATABASE_URL` environment variable or use default `mongodb://localhost:27017/back2use`

**Run the seed script:**

```bash
# Using npm
npm run seed

# Using yarn
yarn seed

# Using pnpm
pnpm seed
```

#### Test Credentials

After seeding, you can login with these credentials:

| Role             | Email               | Password    |
| ---------------- | ------------------- | ----------- |
| Admin            | admin@back2use.com  | password123 |
| Customer 1       | john@example.com    | password123 |
| Customer 2       | jane@example.com    | password123 |
| Business Owner 1 | owner@greencafe.com | password123 |
| Business Owner 2 | owner@ecofood.com   | password123 |

#### Important Notes

⚠️ **Warning:** The seed script will **DELETE ALL EXISTING DATA** from the following collections before seeding:

- users
- businesses
- materials
- subscriptions
- productgroups
- productsizes
- products
- vouchers
- systemsettings
- wallets

Only run this script in **development or testing environments**, never in production!

### Cleanup Script

The cleanup script removes data from your database. Useful for resetting your development environment.

#### How to Run

```bash
# Clean all collections
npm run cleanup

# Keep user accounts
npm run cleanup -- --keep-users

# Keep users and system settings
npm run cleanup -- --keep-users --keep-settings

# Show help
npm run cleanup -- --help
```

#### Options

- `--keep-users` - Preserve user accounts
- `--keep-settings` - Preserve system settings
- `--help` or `-h` - Display help information

The script includes a 3-second delay before execution to allow cancellation with Ctrl+C.

## Environment Variables

Make sure to set your database connection string:

```env
DATABASE_URL=mongodb://localhost:27017/back2use
```

Or update it in your `.env` file.

## Customization

To modify the seed data:

1. Open `scripts/seed.ts`
2. Modify the data objects in each section
3. Run the seed script again

## Troubleshooting

### Connection Issues

If you get connection errors:

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

Make sure MongoDB is running:

```bash
# Windows (if installed as service)
net start MongoDB

# macOS (using brew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Docker
docker start mongodb
```

### Permission Issues

If you get permission errors, ensure your MongoDB user has write permissions to the database.

### Module Import Errors

If you get TypeScript module resolution errors, make sure all dependencies are installed:

```bash
npm install
```

## Database Schema Overview

The application uses MongoDB with Mongoose ODM. Key collections include:

- **users**: User accounts and authentication
- **businesses**: Business profiles and locations
- **materials**: Reusable material types
- **products**: Individual reusable product items
- **productgroups**: Product categories
- **productsizes**: Size variations with pricing
- **subscriptions**: Business subscription plans
- **vouchers**: Discount and reward vouchers
- **wallets**: User balance and eco-points
- **borrowtransactions**: Rental transactions
- **wallettransactions**: Financial transactions
- **notifications**: User notifications
- **systemsettings**: Application configuration

## Future Scripts

Additional scripts that could be added:

- **Migration scripts**: For schema updates
- **Cleanup scripts**: Remove test data
- **Backup scripts**: Export database
- **Reset scripts**: Reset specific collections
- **Fixtures**: Load specific test scenarios
