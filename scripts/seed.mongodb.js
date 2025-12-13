// MongoDB Seed Script
// Run this script in MongoDB Compass, mongosh, or MongoDB Shell
// Usage: mongosh mongodb://localhost:27017/back2use < seed.mongodb.js

// Switch to the database
use back2use;

print("🌱 Starting database seed...\n");

// Clear existing data
print("🗑️  Clearing existing collections...");
db.users.deleteMany({});
db.customers.deleteMany({});
db.businesses.deleteMany({});
db.businesssubscriptions.deleteMany({});
db.staffs.deleteMany({});
db.materials.deleteMany({});
db.subscriptions.deleteMany({});
db.productgroups.deleteMany({});
db.productsizes.deleteMany({});
db.products.deleteMany({});
db.borrowtransactions.deleteMany({});
db.vouchers.deleteMany({});
db.feedbacks.deleteMany({});
db.notifications.deleteMany({});
db.monthlyleaderboards.deleteMany({});
db.systemsettings.deleteMany({});
db.wallets.deleteMany({});
print("✅ Collections cleared\n");

// Helper function to generate ObjectId
function newObjectId() {
  return ObjectId();
}

// Seed Users
print("👥 Seeding users...");
const hashedPassword = "$2b$10$YourHashedPasswordHere"; // You'll need to generate this
const adminId = newObjectId();
const customer1Id = newObjectId();
const customer2Id = newObjectId();
const businessOwner1Id = newObjectId();
const businessOwner2Id = newObjectId();
const customer3Id = newObjectId();
const customer4Id = newObjectId();
const customer5Id = newObjectId();
const customer6Id = newObjectId();
const customer7Id = newObjectId();

db.users.insertMany([
  {
    _id: adminId,
    username: "admin1",
    email: "admin@back2use.com",
    password: hashedPassword,
    avatar: "https://ui-avatars.com/api/?name=Admin&background=random",
    role: ["admin"],
    isActive: true,
    isBlocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: customer1Id,
    username: "johndoe",
    email: "john@example.com",
    password: hashedPassword,
    avatar: "https://ui-avatars.com/api/?name=John+Doe&background=random",
    role: ["customer"],
    isActive: true,
    isBlocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: customer2Id,
    username: "janedoe",
    email: "jane@example.com",
    password: hashedPassword,
    avatar: "https://ui-avatars.com/api/?name=Jane+Doe&background=random",
    role: ["customer"],
    isActive: true,
    isBlocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: businessOwner1Id,
    username: "greencafe",
    email: "owner@greencafe.com",
    password: hashedPassword,
    avatar: "https://ui-avatars.com/api/?name=Green+Cafe&background=random",
    role: ["business", "customer"],
    isActive: true,
    isBlocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: businessOwner2Id,
    username: "ecofood",
    email: "owner@ecofood.com",
    password: hashedPassword,
    avatar: "https://ui-avatars.com/api/?name=Eco+Food&background=random",
    role: ["business", "customer"],
    isActive: true,
    isBlocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: customer3Id,
    username: "alice_nguyen",
    email: "alice.nguyen@example.com",
    password: hashedPassword,
    avatar: "https://ui-avatars.com/api/?name=Alice+Nguyen&background=random",
    role: ["customer"],
    isActive: true,
    isBlocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: customer4Id,
    username: "bob_tran",
    email: "bob.tran@example.com",
    password: hashedPassword,
    avatar: "https://ui-avatars.com/api/?name=Bob+Tran&background=random",
    role: ["customer"],
    isActive: true,
    isBlocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: customer5Id,
    username: "carol_le",
    email: "carol.le@example.com",
    password: hashedPassword,
    avatar: "https://ui-avatars.com/api/?name=Carol+Le&background=random",
    role: ["customer"],
    isActive: true,
    isBlocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: customer6Id,
    username: "david_pham",
    email: "david.pham@example.com",
    password: hashedPassword,
    avatar: "https://ui-avatars.com/api/?name=David+Pham&background=random",
    role: ["customer"],
    isActive: true,
    isBlocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: customer7Id,
    username: "emily_vo",
    email: "emily.vo@example.com",
    password: hashedPassword,
    avatar: "https://ui-avatars.com/api/?name=Emily+Vo&background=random",
    role: ["customer"],
    isActive: true,
    isBlocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);
print("✅ Users seeded\n");

// Seed Materials
print("♻️  Seeding materials...");
const steelMaterialId = newObjectId();
const glassMaterialId = newObjectId();
const plasticMaterialId = newObjectId();
const bambooMaterialId = newObjectId();

db.materials.insertMany([
  {
    _id: steelMaterialId,
    materialName: "Stainless Steel",
    reuseLimit: 500,
    depositPercent: 50,
    description: "Durable stainless steel containers suitable for food storage",
    plasticEquivalentMultiplier: 0.8,
    co2EmissionPerKg: 1.85,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: glassMaterialId,
    materialName: "Glass",
    reuseLimit: 300,
    depositPercent: 40,
    description: "High-quality glass containers for beverages and food",
    plasticEquivalentMultiplier: 0.6,
    co2EmissionPerKg: 0.85,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: plasticMaterialId,
    materialName: "Food-Grade Plastic",
    reuseLimit: 100,
    depositPercent: 30,
    description: "Reusable BPA-free plastic containers",
    plasticEquivalentMultiplier: 1.0,
    co2EmissionPerKg: 2.1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: bambooMaterialId,
    materialName: "Bamboo Fiber",
    reuseLimit: 200,
    depositPercent: 35,
    description: "Eco-friendly bamboo fiber containers",
    plasticEquivalentMultiplier: 0.4,
    co2EmissionPerKg: 0.5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);
print("✅ Materials seeded\n");

// Seed Subscriptions
print("💳 Seeding subscriptions...");
db.subscriptions.insertMany([
  {
    name: "Free Trial",
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
    name: "Basic Plan",
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
    name: "Pro Plan",
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
    name: "Enterprise Plan",
    price: 999000,
    durationInDays: 30,
    isActive: true,
    isTrial: false,
    limits: {
      productGroupLimit: -1,
      productItemLimit: -1,
    },
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);
print("✅ Subscriptions seeded\n");

// Seed System Settings
print("⚙️  Seeding system settings...");
db.systemsettings.insertMany([
  {
    category: "reward",
    key: "reward_policy",
    value: {
      rewardSuccess: 15,
      rewardLate: 7,
      rewardFailed: 0,
      rankingSuccess: 15,
      rankingLate: 7,
      rankingFailedPenalty: -15
    },
    description: "Reward policy for borrow-return",
    updatedBy: adminId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    category: "borrow",
    key: "borrow_policy",
    value: {
      maxDaysBorrowAllowed: 10,
      maxDaysLateAllowed: 2,
      percentDepositPerDay: 10,
      autoCancelHours: 24,
      maxConcurrentBorrows: 3,
      maxExtensions: 3
    },
    description: "Borrow policy for transactions",
    updatedBy: adminId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    category: "return_check",
    key: "damage_issues",
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
      broken: 10
    },
    description: "Return check policy for borrow-return",
    updatedBy: adminId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);
print("✅ System settings seeded\n");

// Seed Businesses
print("🏢 Seeding businesses...");
const business1Id = newObjectId();
const business2Id = newObjectId();
const businessFormId = newObjectId();

db.businesses.insertMany([
  {
    _id: business1Id,
    businessFormId: businessFormId,
    userId: businessOwner1Id,
    businessMail: "contact@greencafe.vn",
    businessName: "Green Cafe",
    taxCode: "0123456789",
    businessAddress: "123 Nguyen Hue, District 1, Ho Chi Minh City",
    businessPhone: "+84901234567",
    businessType: "Cafe & Restaurant",
    openTime: "07:00",
    closeTime: "22:00",
    businessLogoUrl: "https://placehold.co/400x400/green/white?text=Green+Cafe",
    foodSafetyCertUrl: "https://example.com/certs/food-safety-green.pdf",
    businessLicenseUrl: "https://example.com/certs/license-green.pdf",
    location: {
      type: "Point",
      coordinates: [106.7009, 10.7769],
    },
    co2Reduced: 125.5,
    ecoPoints: 1250,
    averageRating: 4.5,
    totalReviews: 42,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: business2Id,
    businessFormId: businessFormId,
    userId: businessOwner2Id,
    businessMail: "info@ecofood.vn",
    businessName: "Eco Food Market",
    taxCode: "0987654321",
    businessAddress: "456 Le Loi, District 3, Ho Chi Minh City",
    businessPhone: "+84907654321",
    businessType: "Restaurant & Food Court",
    openTime: "08:00",
    closeTime: "23:00",
    businessLogoUrl: "https://placehold.co/400x400/blue/white?text=Eco+Food",
    foodSafetyCertUrl: "https://example.com/certs/food-safety-eco.pdf",
    businessLicenseUrl: "https://example.com/certs/license-eco.pdf",
    location: {
      type: "Point",
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

// Create geospatial index
db.businesses.createIndex({ location: "2dsphere" });
print("✅ Businesses seeded\n");

// Seed Customer Profiles
print("👥 Seeding customer profiles...");
db.customers.insertMany([
  {
    userId: customer1Id,
    fullName: "John Doe",
    phone: "+84901234567",
    address: "123 Le Loi Street, District 1, Ho Chi Minh City",
    yob: new Date("1990-05-15"),
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
    fullName: "Jane Doe",
    phone: "+84907654321",
    address: "456 Nguyen Trai Street, District 5, Ho Chi Minh City",
    yob: new Date("1992-08-22"),
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
    fullName: "Alice Nguyen",
    phone: "+84903456789",
    address: "789 Tran Hung Dao Street, District 3, Ho Chi Minh City",
    yob: new Date("1995-03-10"),
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
    fullName: "Bob Tran",
    phone: "+84909876543",
    address: "321 Vo Van Tan Street, District 10, Ho Chi Minh City",
    yob: new Date("1988-11-28"),
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
    fullName: "Carol Le",
    phone: "+84912345678",
    address: "654 Cong Quynh Street, District 7, Ho Chi Minh City",
    yob: new Date("1993-07-05"),
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
    fullName: "David Pham",
    phone: "+84908765432",
    address: "987 Hai Ba Trung Street, District 1, Ho Chi Minh City",
    yob: new Date("1991-12-18"),
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
    fullName: "Emily Vo",
    phone: "+84915678901",
    address: "147 Ly Thuong Kiet Street, District 11, Ho Chi Minh City",
    yob: new Date("1994-04-30"),
    rankingPoints: 720,
    rewardPoints: 280,
    returnSuccessCount: 52,
    returnFailedCount: 1,
    co2Reduced: 38.6,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);
print("✅ Customer profiles seeded\n");

// Seed Business Subscriptions
print("📋 Seeding business subscriptions...");
const business1Id = db.businesses.findOne({ businessName: "Green Cafe" })._id;
const business2Id = db.businesses.findOne({ businessName: "EcoFood Market" })._id;
const subscription1Id = db.subscriptions.findOne({ name: "Free Plan" })._id;
const subscription2Id = db.subscriptions.findOne({ name: "Premium Plan" })._id;

db.businesssubscriptions.insertMany([
  {
    businessId: business1Id,
    subscriptionId: subscription1Id,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    status: "active",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    businessId: business2Id,
    subscriptionId: subscription2Id,
    startDate: new Date("2024-01-15"),
    endDate: new Date("2025-01-14"),
    status: "active",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
]);
print("✅ Business subscriptions seeded\n");

// Seed Staffs
print("👔 Seeding staffs...");
db.staffs.insertMany([
  {
    userId: newObjectId(),
    businessId: business1Id,
    fullName: "Nguyen Van A",
    phone: "+84912345678",
    position: "Manager",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: newObjectId(),
    businessId: business1Id,
    fullName: "Tran Thi B",
    phone: "+84923456789",
    position: "Staff",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: newObjectId(),
    businessId: business2Id,
    fullName: "Le Van C",
    phone: "+84934567890",
    position: "Manager",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);
print("✅ Staffs seeded\n");

// Seed Borrow Transactions
print("🔄 Seeding borrow transactions...");
const product1 = db.products.findOne({ productName: "Stainless Steel Cup" });
const product2 = db.products.findOne({ productName: "Glass Water Bottle" });

db.borrowtransactions.insertMany([
  {
    userId: customer1Id,
    businessId: business1Id,
    productId: product1._id,
    status: "borrowing",
    transactionType: "borrow",
    borrowDate: new Date("2024-12-01T10:00:00Z"),
    expectedReturnDate: new Date("2024-12-08T10:00:00Z"),
    deposit: 50000,
    createdAt: new Date("2024-12-01T10:00:00Z"),
    updatedAt: new Date("2024-12-01T10:00:00Z"),
  },
  {
    userId: customer2Id,
    businessId: business1Id,
    productId: product2._id,
    status: "returned",
    transactionType: "borrow",
    borrowDate: new Date("2024-11-20T14:30:00Z"),
    expectedReturnDate: new Date("2024-11-27T14:30:00Z"),
    actualReturnDate: new Date("2024-11-26T16:45:00Z"),
    deposit: 100000,
    createdAt: new Date("2024-11-20T14:30:00Z"),
    updatedAt: new Date("2024-11-26T16:45:00Z"),
  },
  {
    userId: customer3Id,
    businessId: business2Id,
    productId: product1._id,
    status: "returned",
    transactionType: "borrow",
    borrowDate: new Date("2024-11-15T09:00:00Z"),
    expectedReturnDate: new Date("2024-11-22T09:00:00Z"),
    actualReturnDate: new Date("2024-11-21T11:20:00Z"),
    deposit: 50000,
    createdAt: new Date("2024-11-15T09:00:00Z"),
    updatedAt: new Date("2024-11-21T11:20:00Z"),
  },
]);
print("✅ Borrow transactions seeded\n");

// Seed Feedback
print("💬 Seeding feedback...");
db.feedbacks.insertMany([
  {
    userId: customer1Id,
    businessId: business1Id,
    rating: 5,
    comment: "Excellent service! Very eco-friendly and convenient.",
    createdAt: new Date("2024-12-01T12:00:00Z"),
    updatedAt: new Date("2024-12-01T12:00:00Z"),
  },
  {
    userId: customer2Id,
    businessId: business2Id,
    rating: 4,
    comment: "Good quality products and friendly staff.",
    createdAt: new Date("2024-11-28T15:30:00Z"),
    updatedAt: new Date("2024-11-28T15:30:00Z"),
  },
]);
print("✅ Feedback seeded\n");

// Seed Notifications
print("🔔 Seeding notifications...");
db.notifications.insertMany([
  {
    userId: customer1Id,
    type: "borrow_reminder",
    title: "Return Reminder",
    message: "Your borrowed item is due for return in 2 days.",
    referenceId: newObjectId(),
    referenceType: "borrow_transaction",
    isRead: false,
    createdAt: new Date("2024-12-06T08:00:00Z"),
    updatedAt: new Date("2024-12-06T08:00:00Z"),
  },
  {
    userId: customer2Id,
    type: "reward_earned",
    title: "Reward Points Earned",
    message: "You earned 50 reward points for returning on time!",
    referenceId: newObjectId(),
    referenceType: "wallet_transaction",
    isRead: true,
    createdAt: new Date("2024-11-26T17:00:00Z"),
    updatedAt: new Date("2024-11-27T09:00:00Z"),
  },
  {
    userId: businessOwner1Id,
    type: "new_borrow",
    title: "New Borrow Request",
    message: "A customer has borrowed a product from your business.",
    referenceId: newObjectId(),
    referenceType: "borrow_transaction",
    isRead: false,
    createdAt: new Date("2024-12-01T10:05:00Z"),
    updatedAt: new Date("2024-12-01T10:05:00Z"),
  },
]);
print("✅ Notifications seeded\n");

// Seed Monthly Leaderboards
print("🏆 Seeding monthly leaderboards...");
const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1;
const currentYear = currentDate.getFullYear();

db.monthlyleaderboards.insertMany([
  {
    userId: customer7Id,
    month: currentMonth,
    year: currentYear,
    rankingPoints: 720,
    totalCO2Reduced: 15.3,
    totalBorrows: 24,
    rank: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: customer5Id,
    month: currentMonth,
    year: currentYear,
    rankingPoints: 610,
    totalCO2Reduced: 12.8,
    totalBorrows: 20,
    rank: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: customer3Id,
    month: currentMonth,
    year: currentYear,
    rankingPoints: 500,
    totalCO2Reduced: 10.5,
    totalBorrows: 18,
    rank: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: customer4Id,
    month: currentMonth,
    year: currentYear,
    rankingPoints: 460,
    totalCO2Reduced: 9.2,
    totalBorrows: 15,
    rank: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: customer1Id,
    month: currentMonth,
    year: currentYear,
    rankingPoints: 450,
    totalCO2Reduced: 8.7,
    totalBorrows: 14,
    rank: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);
print("✅ Monthly leaderboards seeded\n");

// Seed Wallets (each user has customer and business wallets)
print("💰 Seeding wallets...");
db.wallets.insertMany([
  {
    userId: customer1Id,
    type: "customer",
    availableBalance: 827500,
    holdingBalance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: customer2Id,
    type: "customer",
    availableBalance: 880400,
    holdingBalance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: businessOwner1Id,
    type: "customer",
    availableBalance: 1000000,
    holdingBalance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: businessOwner1Id,
    type: "business",
    availableBalance: 1266100,
    holdingBalance: 386500,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: businessOwner2Id,
    type: "customer",
    availableBalance: 1000000,
    holdingBalance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: businessOwner2Id,
    type: "business",
    availableBalance: 1401000,
    holdingBalance: 300,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: customer3Id,
    type: "customer",
    availableBalance: 750000,
    holdingBalance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: customer4Id,
    type: "customer",
    availableBalance: 650000,
    holdingBalance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: customer5Id,
    type: "customer",
    availableBalance: 920000,
    holdingBalance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: customer6Id,
    type: "customer",
    availableBalance: 580000,
    holdingBalance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: customer7Id,
    type: "customer",
    availableBalance: 1100000,
    holdingBalance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);
print("✅ Wallets seeded\n");

// Seed Vouchers
print("🎫 Seeding vouchers...");
db.vouchers.insertMany([
  {
    voucherType: "discount",
    name: "10% Off First Order",
    description: "Get 10% discount on your first reusable container order",
    discountPercent: 10,
    baseCode: "WELCOME10",
    rewardPointCost: 0,
    redeemedCount: 5,
    maxUsage: 100,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2025-12-31"),
    isDisabled: false,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    voucherType: "discount",
    name: "20% Eco Warrior Discount",
    description: "Special discount for eco-conscious users",
    discountPercent: 20,
    baseCode: "ECO20",
    rewardPointCost: 50,
    redeemedCount: 12,
    maxUsage: 50,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2025-12-31"),
    isDisabled: false,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    voucherType: "reward",
    name: "Free Coffee Cup Rental",
    description: "Get a free coffee cup rental with your eco points",
    baseCode: "FREECUP",
    rewardPointCost: 100,
    redeemedCount: 8,
    maxUsage: 30,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2025-12-31"),
    isDisabled: false,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);
print("✅ Vouchers seeded\n");

print("\n✅ Database seeding completed successfully!\n");
print("📊 Summary:");
print("- Users: 10 (1 admin + 7 customers + 2 businesses)");
print("- Customer Profiles: 7");
print("- Materials: 4");
print("- Subscriptions: 4");
print("- Businesses: 2");
print("- Business Subscriptions: 2");
print("- Staffs: 3");
print("- Product Groups: 3");
print("- Product Sizes: 6");
print("- Products: 51");
print("- Borrow Transactions: 3");
print("- Vouchers: 3");
print("- Wallets: 11 (9 customer + 2 business)");
print("- Feedback: 2");
print("- Notifications: 3");
print("- Monthly Leaderboards: 5");
print("- System Settings: 3\n");

print("🔑 Test Credentials:");
print("Admin: admin@back2use.com / password123");
print("Customers:");
print("  - john@example.com / password123");
print("  - jane@example.com / password123");
print("  - alice.nguyen@example.com / password123");
print("  - bob.tran@example.com / password123");
print("  - carol.le@example.com / password123");
print("  - david.pham@example.com / password123");
print("  - emily.vo@example.com / password123");
print("Businesses:");
print("  - owner@greencafe.com / password123");
print("  - owner@ecofood.com / password123\n");

print("⚠️  Note: Password hashes need to be generated with bcrypt");
print("Run the TypeScript seed script for proper password hashing.\n");
