# Database Quick Start Guide

## First Time Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Database Connection

Create a `.env` file in the root directory:

```env
DATABASE_URL=mongodb://localhost:27017/back2use
```

### 3. Start MongoDB

Make sure MongoDB is running:

**Windows:**

```bash
net start MongoDB
```

**macOS:**

```bash
brew services start mongodb-community
```

**Linux:**

```bash
sudo systemctl start mongod
```

**Docker:**

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Seed the Database

```bash
npm run seed
```

This will create:

- 5 test users (admin, 2 customers, 2 business owners)
- 4 material types
- 4 subscription plans
- 2 businesses with products
- Sample wallets, vouchers, and settings

### 5. Start the Application

```bash
npm run start:dev
```

## Daily Development Workflow

### Reset Database

If you need to reset your database to a clean state:

```bash
npm run cleanup
npm run seed
```

### Keep Users While Resetting

To reset everything except user accounts:

```bash
npm run cleanup -- --keep-users
```

### Keep Settings

To reset but preserve system settings:

```bash
npm run cleanup -- --keep-users --keep-settings
```

## Test Accounts

After seeding, login with these credentials:

| Role         | Email               | Password    |
| ------------ | ------------------- | ----------- |
| **Admin**    | admin@back2use.com  | password123 |
| **Customer** | john@example.com    | password123 |
| **Customer** | jane@example.com    | password123 |
| **Business** | owner@greencafe.com | password123 |
| **Business** | owner@ecofood.com   | password123 |

## Useful MongoDB Commands

### Connect via mongosh

```bash
mongosh mongodb://localhost:27017/back2use
```

### View Collections

```javascript
show collections
```

### Count Documents

```javascript
db.users.countDocuments();
db.products.countDocuments();
```

### Find Documents

```javascript
db.users.find().pretty();
db.businesses.find({ businessName: 'Green Cafe' });
```

### Drop Database (Nuclear Option)

```javascript
use back2use
db.dropDatabase()
```

## MongoDB Compass

For a GUI interface, use [MongoDB Compass](https://www.mongodb.com/products/compass):

1. Download and install MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Select the `back2use` database
4. Browse collections visually

## Troubleshooting

### Connection Refused Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:** Start MongoDB service (see step 3 above)

### Authentication Error

```
MongoServerError: Authentication failed
```

**Solution:** Check your DATABASE_URL or remove authentication temporarily for development

### Module Not Found

```
Error: Cannot find module 'mongoose'
```

**Solution:**

```bash
npm install
```

### Permission Denied

**Solution:** Run MongoDB with appropriate permissions or adjust data directory ownership

### Port Already in Use

```
Error: Address already in use
```

**Solution:** Stop other MongoDB instances or change the port in DATABASE_URL

## Production Deployment

⚠️ **NEVER run seed or cleanup scripts in production!**

For production:

1. Set strong DATABASE_URL with authentication
2. Use environment-specific .env files
3. Enable MongoDB authentication and SSL
4. Set up regular backups
5. Use migration scripts instead of seeding

## Need Help?

- Check logs in the console output
- Verify MongoDB is running: `mongosh --eval "db.version()"`
- Review connection string format
- Check firewall settings
- Consult MongoDB documentation

## Next Steps

After setting up the database:

1. Explore the API endpoints with Swagger (http://localhost:3000/api)
2. Test authentication with the seeded users
3. Create your own data through the API
4. Review the schema files in `src/modules/**/schemas/`
