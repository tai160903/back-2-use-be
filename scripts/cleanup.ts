import { connect, connection } from 'mongoose';

/**
 * Database cleanup script
 * Removes all data from specified collections
 */

interface CleanupOptions {
  collections?: string[];
  keepUsers?: boolean;
  keepSystemSettings?: boolean;
}

async function cleanup(options: CleanupOptions = {}) {
  try {
    // Connect to MongoDB
    const dbUrl =
      process.env.DATABASE_URL || 'mongodb://localhost:27017/back2use';
    await connect(dbUrl);
    console.log('Connected to MongoDB');

    const db = connection.db;

    // Default collections to clean
    const defaultCollections = [
      'users',
      'businesses',
      'materials',
      'subscriptions',
      'productgroups',
      'productsizes',
      'products',
      'vouchers',
      'vouchercodes',
      'systemsettings',
      'wallets',
      'wallettransactions',
      'borrowtransactions',
      'notifications',
      'feedback',
      'monthlyleaderboards',
      'leaderboardrewards',
      'leaderboardrewardpolicies',
      'ecorewardpolicies',
      'staffs',
      'businesssubscriptions',
      'businessvouchers',
      'qrcoderequests',
    ];

    let collectionsToClean = options.collections || defaultCollections;

    // Filter out collections based on options
    if (options.keepUsers) {
      collectionsToClean = collectionsToClean.filter((c) => c !== 'users');
      console.log('⚠️  Keeping users collection');
    }

    if (options.keepSystemSettings) {
      collectionsToClean = collectionsToClean.filter(
        (c) => c !== 'systemsettings',
      );
      console.log('⚠️  Keeping systemsettings collection');
    }

    console.log('\n🗑️  Starting cleanup...\n');

    let totalDeleted = 0;
    const results: { collection: string; deleted: number }[] = [];

    for (const collectionName of collectionsToClean) {
      try {
        const result = await db.collection(collectionName).deleteMany({});
        const deleted = result.deletedCount || 0;
        totalDeleted += deleted;

        if (deleted > 0) {
          console.log(`✅ ${collectionName}: ${deleted} documents deleted`);
          results.push({ collection: collectionName, deleted });
        } else {
          console.log(`⚪ ${collectionName}: empty`);
        }
      } catch (error: any) {
        if (error.code === 26) {
          // Collection doesn't exist
          console.log(`⚪ ${collectionName}: collection doesn't exist`);
        } else {
          console.error(`❌ ${collectionName}: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Cleanup completed successfully!');
    console.log(`📊 Total documents deleted: ${totalDeleted}`);

    if (results.length > 0) {
      console.log('\n📋 Summary:');
      results.forEach((r) => {
        console.log(`   ${r.collection}: ${r.deleted}`);
      });
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: CleanupOptions = {};

if (args.includes('--keep-users')) {
  options.keepUsers = true;
}

if (args.includes('--keep-settings')) {
  options.keepSystemSettings = true;
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Database Cleanup Script
Usage: npm run cleanup [options]

Options:
  --keep-users      Keep user accounts (don't delete users collection)
  --keep-settings   Keep system settings
  --help, -h        Show this help message

Examples:
  npm run cleanup                    # Clean all collections
  npm run cleanup -- --keep-users    # Clean all except users
  npm run cleanup -- --keep-users --keep-settings
  `);
  process.exit(0);
}

// Run cleanup
console.log('⚠️  WARNING: This will delete data from your database!');
console.log(
  'Database:',
  process.env.DATABASE_URL || 'mongodb://localhost:27017/back2use',
);
console.log('\nStarting in 3 seconds... Press Ctrl+C to cancel\n');

setTimeout(() => {
  cleanup(options);
}, 3000);
