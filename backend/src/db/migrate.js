require('dotenv').config();
const { connectDB, mongoose } = require('./index');
const User = require('../models/User');
const Room = require('../models/Room');
const Customer = require('../models/Customer');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const Counter = require('../models/Counter');

async function migrate() {
  await connectDB();
  try {
    console.log('Running MongoDB migrations...');
    await Promise.all([
      User.syncIndexes(),
      Room.syncIndexes(),
      Customer.syncIndexes(),
      Booking.syncIndexes(),
      Invoice.syncIndexes(),
    ]);
    await Counter.updateOne(
      { _id: 'invoice' },
      { $setOnInsert: { seq: 0 } },
      { upsert: true }
    );
    console.log('✅ MongoDB indexes and counters are ready');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    await mongoose.connection.close();
  }
}

migrate().catch(process.exit.bind(process, 1));