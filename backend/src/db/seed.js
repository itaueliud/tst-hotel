require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, mongoose } = require('./index');
const User = require('../models/User');
const Room = require('../models/Room');
const Customer = require('../models/Customer');

async function seed() {
  await connectDB();
  try {
    console.log('Seeding MongoDB...');

    const adminHash = await bcrypt.hash('TST@Admin2026', 12);
    await User.updateOne(
      { email: 'admin@tsthotels.com' },
      {
        $setOnInsert: {
          name: 'Super Administrator',
          email: 'admin@tsthotels.com',
          password: adminHash,
          role: 'admin',
        }
      },
      { upsert: true }
    );

    const staffHash = await bcrypt.hash('Staff@2026', 12);
    await User.updateOne(
      { email: 'staff@tsthotels.com' },
      {
        $setOnInsert: {
          name: 'Front Desk Staff',
          email: 'staff@tsthotels.com',
          password: staffHash,
          role: 'staff',
        }
      },
      { upsert: true }
    );

    const rooms = [
      { number: '101', floor: 1, type: 'standard', price: 4500, capacity: 2, desc: 'Comfortable standard room with garden view' },
      { number: '102', floor: 1, type: 'standard', price: 4500, capacity: 2, desc: 'Comfortable standard room with garden view' },
      { number: '103', floor: 1, type: 'standard', price: 4500, capacity: 2, desc: 'Bright room near the lobby' },
      { number: '201', floor: 2, type: 'deluxe', price: 7500, capacity: 2, desc: 'Spacious deluxe room with city view and sitting area' },
      { number: '202', floor: 2, type: 'deluxe', price: 7500, capacity: 3, desc: 'Deluxe room with extra bed option' },
      { number: '203', floor: 2, type: 'deluxe', price: 8000, capacity: 2, desc: 'Deluxe corner room with panoramic view' },
      { number: '301', floor: 3, type: 'suite', price: 15000, capacity: 4, desc: 'Luxury suite with living area, kitchenette and pool view' },
      { number: '302', floor: 3, type: 'suite', price: 15000, capacity: 4, desc: 'Family suite with two bedrooms' },
      { number: '401', floor: 4, type: 'executive', price: 25000, capacity: 2, desc: 'Executive penthouse suite with private balcony and butler service' },
      { number: '402', floor: 4, type: 'executive', price: 22000, capacity: 3, desc: 'Executive suite with premium amenities' },
    ];

    for (const room of rooms) {
      await Room.updateOne(
        { room_number: room.number },
        {
          $setOnInsert: {
            room_number: room.number,
            floor: room.floor,
            type: room.type,
            status: 'available',
            price_night: room.price,
            capacity: room.capacity,
            description: room.desc,
            amenities: { wifi: true, ac: true, tv: true, minibar: room.type !== 'standard', safe: true },
          }
        },
        { upsert: true }
      );
    }

    const customers = [
      { name: 'James Mwangi', email: 'james.mwangi@email.com', phone: '+254712345678', id_number: 'KE12345678', nationality: 'Kenyan', tier: 'vip', total_stays: 12 },
      { name: 'Amina Hassan', email: 'amina.hassan@email.com', phone: '+254723456789', id_number: 'KE23456789', nationality: 'Kenyan', tier: 'regular', total_stays: 4 },
      { name: 'David Ochieng', email: 'david.ochieng@email.com', phone: '+254734567890', id_number: 'KE34567890', nationality: 'Kenyan', tier: 'new', total_stays: 1 },
    ];

    for (const customer of customers) {
      await Customer.updateOne(
        { email: customer.email },
        {
          $setOnInsert: {
            full_name: customer.name,
            email: customer.email,
            phone: customer.phone,
            id_number: customer.id_number,
            nationality: customer.nationality,
            tier: customer.tier,
            total_stays: customer.total_stays,
          }
        },
        { upsert: true }
      );
    }

    console.log('✅ MongoDB seeded successfully');
    console.log('   Admin: admin@tsthotels.com / TST@Admin2026');
    console.log('   Staff: staff@tsthotels.com / Staff@2026');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    await mongoose.connection.close();
  }
}

seed().catch(process.exit.bind(process, 1));