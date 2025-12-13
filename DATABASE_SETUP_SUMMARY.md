# Database Setup Summary

## ✅ Created Files

### Main Scripts

1. **scripts/seed.ts**

   - TypeScript seed script with comprehensive test data
   - Creates 5 users, 4 materials, 4 subscriptions, 2 businesses
   - Seeds 51 products across 4 product groups
   - Includes vouchers, wallets, and system settings
   - Uses bcrypt for password hashing
   - Proper MongoDB ObjectId relationships

2. **scripts/cleanup.ts**

   - Database cleanup utility
   - Options to preserve users and settings
   - Safe deletion with confirmation delay
   - Comprehensive error handling

3. **scripts/seed.mongodb.js**
   - Pure MongoDB shell script
   - Can be run in MongoDB Compass or mongosh
   - Alternative to TypeScript version
   - Useful for quick manual seeding

### Documentation

4. **scripts/README.md**

   - Comprehensive documentation for all scripts
   - Usage instructions and examples
   - Troubleshooting guide
   - Database schema overview

5. **scripts/QUICKSTART.md**

   - Step-by-step setup guide
   - Daily development workflow
   - MongoDB commands reference
   - Common troubleshooting scenarios

6. **.env.example**
   - Complete environment configuration template
   - All required and optional variables
   - Payment gateway configuration
   - OAuth provider setup

### Updated Files

7. **package.json**

   - Added `seed` script command
   - Added `cleanup` script command
   - Ready to use with npm/yarn/pnpm

8. **README.md**
   - Updated project description
   - Added features section
   - Database setup instructions
   - Test credentials table
   - Project structure overview
   - API documentation info

## 📊 Seed Data Overview

### Users (5)

- 1 Admin (admin@back2use.com)
- 2 Customers (john@example.com, jane@example.com)
- 2 Business Owners (owner@greencafe.com, owner@ecofood.com)
- All passwords: `password123`

### Materials (4)

- Stainless Steel (500 reuse limit)
- Glass (300 reuse limit)
- Food-Grade Plastic (100 reuse limit)
- Bamboo Fiber (200 reuse limit)

### Subscriptions (4)

- Free Trial - 0 VND, 30 days, 2 groups, 20 items
- Basic Plan - 199,000 VND, 5 groups, 100 items
- Pro Plan - 499,000 VND, 15 groups, 500 items
- Enterprise - 999,000 VND, unlimited

### Businesses (2)

- Green Cafe - Ho Chi Minh City, 4.5★
- Eco Food Market - Ho Chi Minh City, 4.8★

### Products (51)

- 10 Small coffee cups (stainless steel)
- 8 Large coffee cups (stainless steel)
- 6 Smoothie glasses (glass)
- 15 Food containers (plastic)
- 12 Bamboo bowls (bamboo fiber)

### Vouchers (4)

- WELCOME10 - 10% off first order
- ECO20 - 20% eco warrior discount
- FREECUP - Free coffee cup rental
- SUMMER15 - 15% summer special

### Wallets (4)

- Customer wallets with initial balances
- Eco-points allocated
- Ready for transactions

### System Settings (3)

- Eco-reward conversion rates
- Late fee configuration
- Leaderboard rewards

## 🚀 Quick Start Commands

```bash
# First time setup
npm install
cp .env.example .env
# Edit .env with your configuration
npm run seed
npm run start:dev

# Reset database
npm run cleanup
npm run seed

# Keep users when resetting
npm run cleanup -- --keep-users

# View API documentation
# Open http://localhost:3000/api
```

## 📁 File Locations

```
back-2-use-be/
├── .env.example                    # Environment variables template
├── README.md                       # Updated project README
├── package.json                    # Added seed/cleanup scripts
└── scripts/
    ├── seed.ts                     # TypeScript seed script
    ├── seed.mongodb.js             # MongoDB shell script
    ├── cleanup.ts                  # Database cleanup script
    ├── README.md                   # Scripts documentation
    └── QUICKSTART.md               # Quick start guide
```

## ⚠️ Important Notes

1. **Never run in production**: These scripts delete all data!
2. **Backup first**: Always backup production data before any operations
3. **Environment specific**: Use different databases for dev/test/prod
4. **Password security**: Change default passwords in production
5. **MongoDB required**: Make sure MongoDB is running before seeding

## 🔧 Next Steps

1. **Configure Environment**

   - Copy `.env.example` to `.env`
   - Update database connection string
   - Add API keys for external services

2. **Start MongoDB**

   - Ensure MongoDB is running locally or remotely
   - Verify connection with `mongosh`

3. **Seed Database**

   - Run `npm run seed`
   - Verify data in MongoDB Compass

4. **Start Application**

   - Run `npm run start:dev`
   - Access API at http://localhost:3000
   - Check Swagger docs at http://localhost:3000/api

5. **Test Authentication**
   - Login with test credentials
   - Test different user roles
   - Verify JWT token generation

## 📚 Additional Resources

- MongoDB Documentation: https://docs.mongodb.com/
- NestJS Documentation: https://docs.nestjs.com/
- Mongoose Documentation: https://mongoosejs.com/
- JWT Best Practices: https://jwt.io/introduction

## 🐛 Troubleshooting

### Issue: Connection Error

**Solution**: Check if MongoDB is running and DATABASE_URL is correct

### Issue: Module Not Found

**Solution**: Run `npm install` to install dependencies

### Issue: Permission Denied

**Solution**: Check MongoDB user permissions or run without auth in development

### Issue: Duplicate Key Error

**Solution**: Run cleanup script first, then seed again

## 💡 Tips

- Use MongoDB Compass for visual database exploration
- Check console output for detailed seeding information
- Use `--keep-users` option during development to preserve login sessions
- Regularly reset test data to maintain consistency
- Use the MongoDB shell script for quick manual seeds
- Create custom seed scripts for specific test scenarios

## 🎉 Done!

Your database scripts are ready to use. Run `npm run seed` to get started!
