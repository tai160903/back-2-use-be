import { connect, connection } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { RolesEnum } from '../src/common/constants/roles.enum';
import { ProductStatus } from '../src/common/constants/product-status.enum';
import { ProductCondition } from '../src/common/constants/product-condition.enum';
import { VoucherType } from '../src/common/constants/voucher-types.enum';

async function seed() {
  try {
    // Connect to MongoDB
    const dbUrl =
      process.env.DATABASE_URL || 'mongodb://localhost:27017/back2use';
    await connect(dbUrl);
    console.log('Connected to MongoDB');

    const db = connection.db;

    // Clear existing data
    console.log('Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('customers').deleteMany({});
    await db.collection('businesses').deleteMany({});
    await db.collection('businesssubscriptions').deleteMany({});
    await db.collection('staffs').deleteMany({});
    await db.collection('materials').deleteMany({});
    await db.collection('subscriptions').deleteMany({});
    await db.collection('productgroups').deleteMany({});
    await db.collection('productsizes').deleteMany({});
    await db.collection('products').deleteMany({});
    await db.collection('vouchers').deleteMany({});
    await db.collection('systemsettings').deleteMany({});
    await db.collection('wallets').deleteMany({});
    await db.collection('borrowtransactions').deleteMany({});
    await db.collection('feedbacks').deleteMany({});
    await db.collection('notifications').deleteMany({});
    await db.collection('monthlyleaderboards').deleteMany({});
    console.log('Cleared existing data');

    // Seed Users
    console.log('Seeding users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = await db.collection('users').insertMany([
      {
        username: 'admin1',
        email: 'admin@back2use.com',
        password: hashedPassword,
        avatar: 'https://ui-avatars.com/api/?name=Admin&background=random',
        role: [RolesEnum.ADMIN, RolesEnum.CUSTOMER],
        isActive: true,
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'johndoe',
        email: 'john@example.com',
        password: hashedPassword,
        avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
        role: [RolesEnum.CUSTOMER],
        isActive: true,
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'janedoe',
        email: 'jane@example.com',
        password: hashedPassword,
        avatar: 'https://ui-avatars.com/api/?name=Jane+Doe&background=random',
        role: [RolesEnum.CUSTOMER],
        isActive: true,
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'greencafe',
        email: 'owner@greencafe.com',
        password: hashedPassword,
        avatar: 'https://ui-avatars.com/api/?name=Green+Cafe&background=random',
        role: [RolesEnum.BUSINESS, RolesEnum.CUSTOMER],
        isActive: true,
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'ecofood',
        email: 'owner@ecofood.com',
        password: hashedPassword,
        avatar: 'https://ui-avatars.com/api/?name=Eco+Food&background=random',
        role: [RolesEnum.BUSINESS, RolesEnum.CUSTOMER],
        isActive: true,
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'alice_nguyen',
        email: 'alice.nguyen@example.com',
        password: hashedPassword,
        avatar: 'https://ui-avatars.com/api/?name=Alice+Nguyen&background=random',
        role: [RolesEnum.CUSTOMER],
        isActive: true,
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'bob_tran',
        email: 'bob.tran@example.com',
        password: hashedPassword,
        avatar: 'https://ui-avatars.com/api/?name=Bob+Tran&background=random',
        role: [RolesEnum.CUSTOMER],
        isActive: true,
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'carol_le',
        email: 'carol.le@example.com',
        password: hashedPassword,
        avatar: 'https://ui-avatars.com/api/?name=Carol+Le&background=random',
        role: [RolesEnum.CUSTOMER],
        isActive: true,
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'david_pham',
        email: 'david.pham@example.com',
        password: hashedPassword,
        avatar: 'https://ui-avatars.com/api/?name=David+Pham&background=random',
        role: [RolesEnum.CUSTOMER],
        isActive: true,
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'emily_vo',
        email: 'emily.vo@example.com',
        password: hashedPassword,
        avatar: 'https://ui-avatars.com/api/?name=Emily+Vo&background=random',
        role: [RolesEnum.CUSTOMER],
        isActive: true,
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log(`Seeded ${users.insertedCount} users`);

    const adminUserId = users.insertedIds[0];
    const customer1Id = users.insertedIds[1];
    const customer2Id = users.insertedIds[2];
    const businessOwner1Id = users.insertedIds[3];
    const businessOwner2Id = users.insertedIds[4];
    const customer3Id = users.insertedIds[5];
    const customer4Id = users.insertedIds[6];
    const customer5Id = users.insertedIds[7];
    const customer6Id = users.insertedIds[8];
    const customer7Id = users.insertedIds[9];

    // Seed Materials
    console.log('Seeding materials...');
    const materials = await db.collection('materials').insertMany([
      {
        materialName: 'Stainless Steel',
        reuseLimit: 500,
        depositPercent: 50,
        description:
          'Durable stainless steel containers suitable for food storage',
        plasticEquivalentMultiplier: 0.8,
        co2EmissionPerKg: 1.85,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        materialName: 'Glass',
        reuseLimit: 300,
        depositPercent: 40,
        description: 'High-quality glass containers for beverages and food',
        plasticEquivalentMultiplier: 0.6,
        co2EmissionPerKg: 0.85,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        materialName: 'Food-Grade Plastic',
        reuseLimit: 100,
        depositPercent: 30,
        description: 'Reusable BPA-free plastic containers',
        plasticEquivalentMultiplier: 1.0,
        co2EmissionPerKg: 2.1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        materialName: 'Bamboo Fiber',
        reuseLimit: 200,
        depositPercent: 35,
        description: 'Eco-friendly bamboo fiber containers',
        plasticEquivalentMultiplier: 0.4,
        co2EmissionPerKg: 0.5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log(`Seeded ${materials.insertedCount} materials`);

    const steelMaterialId = materials.insertedIds[0];
    const glassMaterialId = materials.insertedIds[1];
    const plasticMaterialId = materials.insertedIds[2];
    const bambooMaterialId = materials.insertedIds[3];

    // Seed Subscriptions
    console.log('Seeding subscriptions...');
    const subscriptions = await db.collection('subscriptions').insertMany([
      {
        name: 'Free Trial',
        price: 0,
        durationInDays: 30,
        isActive: true,
        isTrial: true,
        limits: {
          productGroupLimit: 2,
          productItemLimit: 20,
        },
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Basic Plan',
        price: 199000,
        durationInDays: 30,
        isActive: true,
        isTrial: false,
        limits: {
          productGroupLimit: 5,
          productItemLimit: 100,
        },
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Pro Plan',
        price: 499000,
        durationInDays: 30,
        isActive: true,
        isTrial: false,
        limits: {
          productGroupLimit: 15,
          productItemLimit: 500,
        },
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Enterprise Plan',
        price: 999000,
        durationInDays: 30,
        isActive: true,
        isTrial: false,
        limits: {
          productGroupLimit: -1, // unlimited
          productItemLimit: -1, // unlimited
        },
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log(`Seeded ${subscriptions.insertedCount} subscriptions`);

    // Seed System Settings
    console.log('Seeding system settings...');
    const systemSettings = await db.collection('systemsettings').insertMany([
      {
        category: 'reward',
        key: 'reward_policy',
        value: {
          rewardSuccess: 15,
          rewardLate: 7,
          rewardFailed: 0,
          rankingSuccess: 15,
          rankingLate: 7,
          rankingFailedPenalty: -15,
        },
        description: 'Reward policy for borrow-return',
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: 'borrow',
        key: 'borrow_policy',
        value: {
          maxDaysBorrowAllowed: 10,
          maxDaysLateAllowed: 2,
          percentDepositPerDay: 10,
          autoCancelHours: 24,
          maxConcurrentBorrows: 3,
          maxExtensions: 3,
        },
        description: 'Borrow policy for transactions',
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: 'return_check',
        key: 'damage_issues',
        value: {
          none: 0,
          scratch_light: 1,
          scratch_medium: 2,
          scratch_heavy: 3,
          dirty_light: 1,
          dirty_heavy: 2,
          dent_small: 3,
          dent_large: 5,
          crack_small: 6,
          crack_large: 8,
          deformed: 8,
          broken: 10,
        },
        description: 'Return check policy for borrow-return',
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log(`Seeded ${systemSettings.insertedCount} system settings`);

    // Seed Businesses
    console.log('Seeding businesses...');
    const businessFormId = { $oid: '507f1f77bcf86cd799439011' }; // Mock business form ID

    const businesses = await db.collection('businesses').insertMany([
      {
        businessFormId,
        userId: businessOwner1Id,
        businessMail: 'contact@greencafe.vn',
        businessName: 'Green Cafe',
        taxCode: '0123456789',
        businessAddress: '123 Nguyen Hue, District 1, Ho Chi Minh City',
        businessPhone: '+84901234567',
        businessType: 'Cafe & Restaurant',
        openTime: '07:00',
        closeTime: '22:00',
        businessLogoUrl:
          'https://placehold.co/400x400/green/white?text=Green+Cafe',
        foodSafetyCertUrl: 'https://example.com/certs/food-safety-green.pdf',
        businessLicenseUrl: 'https://example.com/certs/license-green.pdf',
        location: {
          type: 'Point',
          coordinates: [106.7009, 10.7769], // Ho Chi Minh City
        },
        co2Reduced: 125.5,
        ecoPoints: 1250,
        averageRating: 4.5,
        totalReviews: 42,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        businessFormId,
        userId: businessOwner2Id,
        businessMail: 'info@ecofood.vn',
        businessName: 'Eco Food Market',
        taxCode: '0987654321',
        businessAddress: '456 Le Loi, District 3, Ho Chi Minh City',
        businessPhone: '+84907654321',
        businessType: 'Restaurant & Food Court',
        openTime: '08:00',
        closeTime: '23:00',
        businessLogoUrl:
          'https://placehold.co/400x400/blue/white?text=Eco+Food',
        foodSafetyCertUrl: 'https://example.com/certs/food-safety-eco.pdf',
        businessLicenseUrl: 'https://example.com/certs/license-eco.pdf',
        location: {
          type: 'Point',
          coordinates: [106.6927, 10.7756],
        },
        co2Reduced: 89.3,
        ecoPoints: 890,
        averageRating: 4.8,
        totalReviews: 67,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log(`Seeded ${businesses.insertedCount} businesses`);

    const business1Id = businesses.insertedIds[0];
    const business2Id = businesses.insertedIds[1];

    // Seed Customer Profiles
    console.log('Seeding customer profiles...');
    const customers = await db.collection('customers').insertMany([
      {
        userId: customer1Id,
        fullName: 'John Doe',
        phone: '+84901234567',
        address: '123 Le Loi Street, District 1, Ho Chi Minh City',
        yob: new Date('1990-05-15'),
        rankingPoints: 450,
        rewardPoints: 150,
        returnSuccessCount: 32,
        returnFailedCount: 1,
        co2Reduced: 24.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: customer2Id,
        fullName: 'Jane Doe',
        phone: '+84907654321',
        address: '456 Nguyen Trai Street, District 5, Ho Chi Minh City',
        yob: new Date('1992-08-22'),
        rankingPoints: 380,
        rewardPoints: 85,
        returnSuccessCount: 28,
        returnFailedCount: 0,
        co2Reduced: 19.8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: customer3Id,
        fullName: 'Alice Nguyen',
        phone: '+84903456789',
        address: '789 Tran Hung Dao Street, District 3, Ho Chi Minh City',
        yob: new Date('1995-03-10'),
        rankingPoints: 520,
        rewardPoints: 200,
        returnSuccessCount: 38,
        returnFailedCount: 2,
        co2Reduced: 28.3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: customer4Id,
        fullName: 'Bob Tran',
        phone: '+84909876543',
        address: '321 Vo Van Tan Street, District 10, Ho Chi Minh City',
        yob: new Date('1988-11-28'),
        rankingPoints: 290,
        rewardPoints: 120,
        returnSuccessCount: 22,
        returnFailedCount: 1,
        co2Reduced: 16.7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: customer5Id,
        fullName: 'Carol Le',
        phone: '+84912345678',
        address: '654 Cong Quynh Street, District 7, Ho Chi Minh City',
        yob: new Date('1993-07-05'),
        rankingPoints: 610,
        rewardPoints: 230,
        returnSuccessCount: 45,
        returnFailedCount: 0,
        co2Reduced: 32.4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: customer6Id,
        fullName: 'David Pham',
        phone: '+84908765432',
        address: '987 Hai Ba Trung Street, District 1, Ho Chi Minh City',
        yob: new Date('1991-12-18'),
        rankingPoints: 340,
        rewardPoints: 95,
        returnSuccessCount: 25,
        returnFailedCount: 1,
        co2Reduced: 18.9,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: customer7Id,
        fullName: 'Emily Vo',
        phone: '+84915678901',
        address: '147 Ly Thuong Kiet Street, District 11, Ho Chi Minh City',
        yob: new Date('1994-04-30'),
        rankingPoints: 720,
        rewardPoints: 280,
        returnSuccessCount: 52,
        returnFailedCount: 1,
        co2Reduced: 38.6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log(`Seeded ${customers.insertedCount} customer profiles`);

    // Seed Wallets for users (each user has customer and business wallets)
    console.log('Seeding wallets...');
    const wallets = await db.collection('wallets').insertMany([
      {
        userId: customer1Id,
        type: 'customer',
        availableBalance: 827500,
        holdingBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: customer2Id,
        type: 'customer',
        availableBalance: 880400,
        holdingBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: businessOwner1Id,
        type: 'customer',
        availableBalance: 1000000,
        holdingBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: businessOwner1Id,
        type: 'business',
        availableBalance: 1266100,
        holdingBalance: 386500,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: businessOwner2Id,
        type: 'customer',
        availableBalance: 1000000,
        holdingBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: businessOwner2Id,
        type: 'business',
        availableBalance: 1401000,
        holdingBalance: 300,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: customer3Id,
        type: 'customer',
        availableBalance: 750000,
        holdingBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: customer4Id,
        type: 'customer',
        availableBalance: 650000,
        holdingBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: customer5Id,
        type: 'customer',
        availableBalance: 920000,
        holdingBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: customer6Id,
        type: 'customer',
        availableBalance: 580000,
        holdingBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: customer7Id,
        type: 'customer',
        availableBalance: 1100000,
        holdingBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log(`Seeded ${wallets.insertedCount} wallets`);

    // Seed Business Subscriptions
    console.log('Seeding business subscriptions...');
    const currentDate = new Date();
    const subscriptionIds = Object.values(subscriptions.insertedIds);
    const businessSubscriptions = await db
      .collection('businesssubscriptions')
      .insertMany([
        {
          businessId: business1Id,
          subscriptionId: subscriptionIds[2], // Pro Plan
          startDate: new Date(currentDate.getTime() - 15 * 24 * 60 * 60 * 1000),
          endDate: new Date(currentDate.getTime() + 15 * 24 * 60 * 60 * 1000),
          status: 'active',
          isTrialUsed: true,
          isExpiringNotified: false,
          autoRenew: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessId: business2Id,
          subscriptionId: subscriptionIds[1], // Basic Plan
          startDate: new Date(currentDate.getTime() - 20 * 24 * 60 * 60 * 1000),
          endDate: new Date(currentDate.getTime() + 10 * 24 * 60 * 60 * 1000),
          status: 'active',
          isTrialUsed: true,
          isExpiringNotified: false,
          autoRenew: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    console.log(`Seeded ${businessSubscriptions.insertedCount} business subscriptions`);

    // Seed Staffs
    console.log('Seeding staffs...');
    const staffs = await db.collection('staffs').insertMany([
      {
        businessId: business1Id,
        userId: null,
        fullName: 'Nguyen Van A',
        email: 'staff1@greencafe.com',
        phone: '+84901111111',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        businessId: business1Id,
        userId: null,
        fullName: 'Tran Thi B',
        email: 'staff2@greencafe.com',
        phone: '+84902222222',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        businessId: business2Id,
        userId: null,
        fullName: 'Le Van C',
        email: 'staff1@ecofood.com',
        phone: '+84903333333',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log(`Seeded ${staffs.insertedCount} staffs`);

    // Seed Product Groups
    console.log('Seeding product groups...');
    const productGroups = await db.collection('productgroups').insertMany([
      {
        materialId: steelMaterialId,
        businessId: business1Id,
        name: 'Coffee Cup - Medium',
        description: 'Reusable stainless steel coffee cups',
        imageUrl: 'https://placehold.co/400x300/brown/white?text=Coffee+Cup',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        materialId: glassMaterialId,
        businessId: business1Id,
        name: 'Smoothie Glass',
        description: 'Large glass containers for smoothies and juices',
        imageUrl:
          'https://placehold.co/400x300/orange/white?text=Smoothie+Glass',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        materialId: plasticMaterialId,
        businessId: business2Id,
        name: 'Food Container',
        description: 'Reusable plastic containers for takeaway food',
        imageUrl: 'https://placehold.co/400x300/green/white?text=Food+Box',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        materialId: bambooMaterialId,
        businessId: business2Id,
        name: 'Bamboo Bowl',
        description: 'Eco-friendly bamboo bowls for salads and soups',
        imageUrl: 'https://placehold.co/400x300/tan/white?text=Bamboo+Bowl',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log(`Seeded ${productGroups.insertedCount} product groups`);

    const coffeeGroupId = productGroups.insertedIds[0];
    const smoothieGroupId = productGroups.insertedIds[1];
    const foodContainerGroupId = productGroups.insertedIds[2];
    const bambooGroupId = productGroups.insertedIds[3];

    // Seed Product Sizes
    console.log('Seeding product sizes...');
    const productSizes = await db.collection('productsizes').insertMany([
      {
        businessId: business1Id,
        productGroupId: coffeeGroupId,
        sizeName: 'Small (250ml)',
        basePrice: 15000,
        depositValue: 20000,
        weight: 150,
        plasticEquivalentWeight: 120,
        description: 'Small coffee cup',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        businessId: business1Id,
        productGroupId: coffeeGroupId,
        sizeName: 'Large (500ml)',
        basePrice: 20000,
        depositValue: 30000,
        weight: 200,
        plasticEquivalentWeight: 160,
        description: 'Large coffee cup',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        businessId: business1Id,
        productGroupId: smoothieGroupId,
        sizeName: 'Regular (400ml)',
        basePrice: 25000,
        depositValue: 35000,
        weight: 300,
        plasticEquivalentWeight: 180,
        description: 'Regular smoothie glass',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        businessId: business2Id,
        productGroupId: foodContainerGroupId,
        sizeName: 'Medium (750ml)',
        basePrice: 10000,
        depositValue: 25000,
        weight: 180,
        plasticEquivalentWeight: 180,
        description: 'Medium food container',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        businessId: business2Id,
        productGroupId: bambooGroupId,
        sizeName: 'Regular (500ml)',
        basePrice: 18000,
        depositValue: 28000,
        weight: 120,
        plasticEquivalentWeight: 48,
        description: 'Regular bamboo bowl',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log(`Seeded ${productSizes.insertedCount} product sizes`);

    const coffeeSmallSizeId = productSizes.insertedIds[0];
    const coffeeLargeSizeId = productSizes.insertedIds[1];
    const smoothieSizeId = productSizes.insertedIds[2];
    const foodContainerSizeId = productSizes.insertedIds[3];
    const bambooSizeId = productSizes.insertedIds[4];

    // Seed Products
    console.log('Seeding products...');
    const products = [];

    // Coffee cups - small
    for (let i = 1; i <= 10; i++) {
      products.push({
        productGroupId: coffeeGroupId,
        productSizeId: coffeeSmallSizeId,
        qrCode: `QR-COFFEE-S-${String(i).padStart(3, '0')}`,
        serialNumber: `SN-COFFEE-S-${String(i).padStart(3, '0')}`,
        status: i <= 7 ? ProductStatus.AVAILABLE : ProductStatus.IN_USE,
        condition: ProductCondition.GOOD,
        reuseCount: Math.floor(Math.random() * 30),
        lastConditionNote: '',
        lastConditionImages: {},
        lastDamageFaces: [],
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Coffee cups - large
    for (let i = 1; i <= 8; i++) {
      products.push({
        productGroupId: coffeeGroupId,
        productSizeId: coffeeLargeSizeId,
        qrCode: `QR-COFFEE-L-${String(i).padStart(3, '0')}`,
        serialNumber: `SN-COFFEE-L-${String(i).padStart(3, '0')}`,
        status: i <= 6 ? ProductStatus.AVAILABLE : ProductStatus.IN_USE,
        condition: ProductCondition.GOOD,
        reuseCount: Math.floor(Math.random() * 25),
        lastConditionNote: '',
        lastConditionImages: {},
        lastDamageFaces: [],
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Smoothie glasses
    for (let i = 1; i <= 6; i++) {
      products.push({
        productGroupId: smoothieGroupId,
        productSizeId: smoothieSizeId,
        qrCode: `QR-SMOOTHIE-${String(i).padStart(3, '0')}`,
        serialNumber: `SN-SMOOTHIE-${String(i).padStart(3, '0')}`,
        status: ProductStatus.AVAILABLE,
        condition: ProductCondition.GOOD,
        reuseCount: Math.floor(Math.random() * 20),
        lastConditionNote: '',
        lastConditionImages: {},
        lastDamageFaces: [],
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Food containers
    for (let i = 1; i <= 15; i++) {
      products.push({
        productGroupId: foodContainerGroupId,
        productSizeId: foodContainerSizeId,
        qrCode: `QR-FOOD-${String(i).padStart(3, '0')}`,
        serialNumber: `SN-FOOD-${String(i).padStart(3, '0')}`,
        status: i <= 10 ? ProductStatus.AVAILABLE : ProductStatus.IN_USE,
        condition: i === 14 ? ProductCondition.FAIR : ProductCondition.GOOD,
        reuseCount: Math.floor(Math.random() * 40),
        lastConditionNote: i === 14 ? 'Minor scratches on lid' : '',
        lastConditionImages: {},
        lastDamageFaces: [],
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Bamboo bowls
    for (let i = 1; i <= 12; i++) {
      products.push({
        productGroupId: bambooGroupId,
        productSizeId: bambooSizeId,
        qrCode: `QR-BAMBOO-${String(i).padStart(3, '0')}`,
        serialNumber: `SN-BAMBOO-${String(i).padStart(3, '0')}`,
        status: i <= 9 ? ProductStatus.AVAILABLE : ProductStatus.IN_USE,
        condition: ProductCondition.GOOD,
        reuseCount: Math.floor(Math.random() * 15),
        lastConditionNote: '',
        lastConditionImages: {},
        lastDamageFaces: [],
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await db.collection('products').insertMany(products);
    console.log(`Seeded ${products.length} products`);

    // Seed Vouchers
    console.log('Seeding vouchers...');
    const vouchers = await db.collection('vouchers').insertMany([
      {
        voucherType: VoucherType.DISCOUNT,
        name: '10% Off First Order',
        description: 'Get 10% discount on your first reusable container order',
        discountPercent: 10,
        baseCode: 'WELCOME10',
        rewardPointCost: 0,
        redeemedCount: 5,
        maxUsage: 100,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        isDisabled: false,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        voucherType: VoucherType.DISCOUNT,
        name: '20% Eco Warrior Discount',
        description: 'Special discount for eco-conscious users',
        discountPercent: 20,
        baseCode: 'ECO20',
        rewardPointCost: 50,
        redeemedCount: 12,
        maxUsage: 50,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        isDisabled: false,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        voucherType: VoucherType.REWARD,
        name: 'Free Coffee Cup Rental',
        description: 'Get a free coffee cup rental with your eco points',
        baseCode: 'FREECUP',
        rewardPointCost: 100,
        redeemedCount: 8,
        maxUsage: 30,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        isDisabled: false,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        voucherType: VoucherType.DISCOUNT,
        name: 'Summer Special 15% Off',
        description: 'Summer promotion - 15% off all rentals',
        discountPercent: 15,
        baseCode: 'SUMMER15',
        rewardPointCost: 0,
        redeemedCount: 23,
        maxUsage: 200,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        isDisabled: false,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log(`Seeded ${vouchers.insertedCount} vouchers`);

    // Seed Borrow Transactions
    console.log('Seeding borrow transactions...');
    const productIds = Object.values(products).map((p: any) => p._id);
    const borrowTransactions = await db
      .collection('borrowtransactions')
      .insertMany([
        {
          customerId: customers.insertedIds[0],
          productId: productIds[0],
          businessId: business1Id,
          borrowTransactionType: 'borrow',
          borrowDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          depositAmount: 30000,
          status: 'borrowing',
          qrCode: 'BT-001',
          extensionCount: 0,
          rewardPointChanged: 0,
          rankingPointChanged: 0,
          co2Changed: 0,
          isLateProcessed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          customerId: customers.insertedIds[1],
          productId: productIds[1],
          businessId: business1Id,
          borrowTransactionType: 'borrow',
          borrowDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          returnDate: new Date(),
          depositAmount: 30000,
          status: 'returned',
          qrCode: 'BT-002',
          extensionCount: 0,
          rewardPointChanged: 15,
          rankingPointChanged: 15,
          co2Changed: 0.8,
          isLateProcessed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          customerId: customers.insertedIds[2],
          productId: productIds[10],
          businessId: business2Id,
          borrowTransactionType: 'borrow',
          borrowDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          returnDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          depositAmount: 25000,
          status: 'returned',
          qrCode: 'BT-003',
          extensionCount: 1,
          lastExtensionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          rewardPointChanged: 7,
          rankingPointChanged: 7,
          co2Changed: 0.6,
          isLateProcessed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    console.log(`Seeded ${borrowTransactions.insertedCount} borrow transactions`);

    // Seed Feedback
    console.log('Seeding feedback...');
    const feedback = await db.collection('feedbacks').insertMany([
      {
        customerId: customers.insertedIds[1],
        businessId: business1Id,
        borrowTransactionId: borrowTransactions.insertedIds[1],
        productId: productIds[1],
        rating: 5,
        comment: 'Excellent service! The container was clean and easy to use.',
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        customerId: customers.insertedIds[2],
        businessId: business2Id,
        borrowTransactionId: borrowTransactions.insertedIds[2],
        productId: productIds[10],
        rating: 4,
        comment: 'Good experience overall. Would use again.',
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log(`Seeded ${feedback.insertedCount} feedback entries`);

    // Seed Notifications
    console.log('Seeding notifications...');
    const notifications = await db.collection('notifications').insertMany([
      {
        receiverId: customer1Id,
        receiverType: 'customer',
        type: 'borrow_reminder',
        title: 'Return Reminder',
        message: 'Your borrowed item is due in 2 days. Please return it on time.',
        referenceId: borrowTransactions.insertedIds[0],
        referenceType: 'borrow_transaction',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        receiverId: customer2Id,
        receiverType: 'customer',
        type: 'reward_earned',
        title: 'Reward Points Earned!',
        message: 'You earned 15 reward points for returning on time!',
        referenceId: borrowTransactions.insertedIds[1],
        referenceType: 'borrow_transaction',
        isRead: true,
        readAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        receiverId: businessOwner1Id,
        receiverType: 'business',
        type: 'new_borrow',
        title: 'New Borrow Transaction',
        message: 'A customer has borrowed a product from your business.',
        referenceId: borrowTransactions.insertedIds[0],
        referenceType: 'borrow_transaction',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log(`Seeded ${notifications.insertedCount} notifications`);

    // Seed Monthly Leaderboards
    console.log('Seeding monthly leaderboards...');
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const leaderboards = await db
      .collection('monthlyleaderboards')
      .insertMany([
        {
          customerId: customers.insertedIds[6], // Emily Vo
          month: currentMonth,
          year: currentYear,
          rankingPoints: 720,
          rank: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          customerId: customers.insertedIds[4], // Carol Le
          month: currentMonth,
          year: currentYear,
          rankingPoints: 610,
          rank: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          customerId: customers.insertedIds[2], // Alice Nguyen
          month: currentMonth,
          year: currentYear,
          rankingPoints: 520,
          rank: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          customerId: customers.insertedIds[0], // John Doe
          month: currentMonth,
          year: currentYear,
          rankingPoints: 450,
          rank: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          customerId: customers.insertedIds[1], // Jane Doe
          month: currentMonth,
          year: currentYear,
          rankingPoints: 380,
          rank: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    console.log(`Seeded ${leaderboards.insertedCount} monthly leaderboard entries`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${users.insertedCount}`);    console.log(`- Customer Profiles: ${customers.insertedCount}`);    console.log(`- Materials: ${materials.insertedCount}`);
    console.log(`- Subscriptions: ${subscriptions.insertedCount}`);
    console.log(`- Businesses: ${businesses.insertedCount}`);
    console.log(`- Business Subscriptions: ${businessSubscriptions.insertedCount}`);
    console.log(`- Staffs: ${staffs.insertedCount}`);
    console.log(`- Product Groups: ${productGroups.insertedCount}`);
    console.log(`- Product Sizes: ${productSizes.insertedCount}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Borrow Transactions: ${borrowTransactions.insertedCount}`);
    console.log(`- Vouchers: ${vouchers.insertedCount}`);
    console.log(`- Wallets: ${wallets.insertedCount} (7 customer + 2 business)`);
    console.log(`- Feedback: ${feedbacks.insertedCount}`);
    console.log(`- Notifications: ${notifications.insertedCount}`);
    console.log(`- Monthly Leaderboards: ${monthlyLeaderboards.insertedCount}`);
    console.log(`- System Settings: ${systemSettings.insertedCount}`);

    console.log('\n🔑 Test Credentials:');
    console.log('Admin: admin@back2use.com / password123');
    console.log('Customers:');
    console.log('  - john@example.com / password123');
    console.log('  - jane@example.com / password123');
    console.log('  - alice.nguyen@example.com / password123');
    console.log('  - bob.tran@example.com / password123');
    console.log('  - carol.le@example.com / password123');
    console.log('  - david.pham@example.com / password123');
    console.log('  - emily.vo@example.com / password123');
    console.log('Businesses:');
    console.log('  - owner@greencafe.com / password123');
    console.log('  - owner@ecofood.com / password123');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Run the seed function
seed();
