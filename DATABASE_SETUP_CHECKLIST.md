# Database Setup Checklist

Use this checklist to ensure your database is properly set up.

## ☑️ Pre-Setup Checklist

- [ ] Node.js installed (v18 or higher)
- [ ] MongoDB installed and accessible
- [ ] Git repository cloned
- [ ] Terminal/Command Prompt open in project directory

## ☑️ Initial Setup

- [ ] Run `npm install` to install dependencies
- [ ] Copy `.env.example` to `.env`
- [ ] Update `DATABASE_URL` in `.env` file
- [ ] Update JWT secret and other required variables in `.env`
- [ ] Start MongoDB service

## ☑️ Database Seeding

- [ ] Verify MongoDB is running (`mongosh --eval "db.version()"`)
- [ ] Run `npm run seed` to populate database
- [ ] Check console output for success messages
- [ ] Verify data in MongoDB Compass (optional)

## ☑️ Application Startup

- [ ] Run `npm run start:dev` to start the application
- [ ] Check console for "Application is running" message
- [ ] Access http://localhost:3000 in browser
- [ ] Access API documentation at http://localhost:3000/api

## ☑️ Test Authentication

- [ ] Try logging in as admin (admin@back2use.com / password123)
- [ ] Try logging in as customer (john@example.com / password123)
- [ ] Try logging in as business (owner@greencafe.com / password123)
- [ ] Verify JWT token is returned
- [ ] Test protected endpoints with token

## ☑️ Verify Data

- [ ] Check users collection has 5 users
- [ ] Check materials collection has 4 materials
- [ ] Check businesses collection has 2 businesses
- [ ] Check products collection has 51 products
- [ ] Check subscriptions collection has 4 plans
- [ ] Check vouchers collection has 4 vouchers
- [ ] Check wallets collection has 4 wallets

## ☑️ MongoDB Commands to Verify

```bash
# Connect to database
mongosh mongodb://localhost:27017/back2use

# Run these commands to verify:
db.users.countDocuments()           # Should return 5
db.materials.countDocuments()       # Should return 4
db.businesses.countDocuments()      # Should return 2
db.products.countDocuments()        # Should return 51
db.subscriptions.countDocuments()   # Should return 4
db.vouchers.countDocuments()        # Should return 4
db.wallets.countDocuments()         # Should return 4

# View a sample user
db.users.findOne({ email: "admin@back2use.com" })

# View all businesses
db.businesses.find().pretty()
```

## ☑️ Common Issues Resolved

- [ ] MongoDB connection error → Started MongoDB service
- [ ] Module not found error → Ran `npm install`
- [ ] Permission error → Checked file permissions
- [ ] Port in use error → Stopped other services on port 3000
- [ ] Seed script error → Cleaned database first with `npm run cleanup`

## ☑️ Development Workflow Established

- [ ] Can reset database with `npm run cleanup`
- [ ] Can re-seed with `npm run seed`
- [ ] Can start dev server with `npm run start:dev`
- [ ] Understand how to keep users when cleaning
- [ ] Know where to find API documentation

## ☑️ Optional but Recommended

- [ ] Install MongoDB Compass for visual database browsing
- [ ] Set up Git hooks for linting
- [ ] Configure VS Code extensions (ESLint, Prettier)
- [ ] Review project structure in `src/` folder
- [ ] Read through API documentation
- [ ] Test creating data through API endpoints

## ☑️ Production Readiness (Later)

- [ ] Change all passwords from default
- [ ] Use strong JWT secret
- [ ] Set up MongoDB authentication
- [ ] Configure SSL/TLS for database
- [ ] Set up proper environment variables
- [ ] Remove or protect seed scripts
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Set up logging and monitoring
- [ ] Use environment-specific databases

## 🎯 Success Criteria

You've successfully set up the database when:

✅ Application starts without errors
✅ Can login with test credentials
✅ API returns valid responses
✅ Swagger documentation is accessible
✅ Database has all seeded collections
✅ Can create/read/update/delete data via API

## 📝 Notes

- Keep this checklist handy for reference
- Mark items as you complete them
- If stuck, check the troubleshooting section in QUICKSTART.md
- Ask for help if needed - don't spend hours debugging alone!

## 🎉 Next Steps After Setup

Once everything is checked off:

1. Explore the API endpoints in Swagger
2. Try creating new data through the API
3. Review the codebase structure
4. Read module documentation
5. Start building features!

---

**Need Help?**

- Check [scripts/README.md](scripts/README.md) for detailed documentation
- Read [scripts/QUICKSTART.md](scripts/QUICKSTART.md) for step-by-step guide
- Review [DATABASE_SETUP_SUMMARY.md](DATABASE_SETUP_SUMMARY.md) for overview
