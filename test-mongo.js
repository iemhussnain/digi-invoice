/**
 * Simple MongoDB Connection Test
 * Tests direct connection to MongoDB Atlas
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

console.log('Testing MongoDB Connection...');
console.log('Connection String:', MONGODB_URI?.replace(/:[^:@]+@/, ':****@')); // Hide password

async function testConnection() {
  try {
    console.log('\n🟡 Attempting to connect...\n');

    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
    });

    console.log('✅ SUCCESS! MongoDB Connected');
    console.log('📊 Database:', conn.connection.db.databaseName);
    console.log('🌐 Host:', conn.connection.host);
    console.log('📡 Port:', conn.connection.port);
    console.log('✨ Connection State:', conn.connection.readyState); // 1 = connected

    await mongoose.disconnect();
    console.log('\n✅ Test completed successfully!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ CONNECTION FAILED');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);

    if (error.message.includes('querySrv')) {
      console.error('\n💡 DNS Issue Detected!');
      console.error('This environment may not support SRV DNS lookups.');
      console.error('\n📝 Solutions:');
      console.error('1. Get standard connection string from Atlas (not SRV format)');
      console.error('2. Or use local MongoDB instead');
    }

    process.exit(1);
  }
}

testConnection();
