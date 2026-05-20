require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./index');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');

    // Admin user
    const hash = await bcrypt.hash('TST@Admin2026', 12);
    await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ('Super Administrator', 'admin@tsthotels.com', $1, 'admin')
      ON CONFLICT (email) DO NOTHING
    `, [hash]);

    // Staff user
    const staffHash = await bcrypt.hash('Staff@2026', 12);
    await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ('Front Desk Staff', 'staff@tsthotels.com', $1, 'staff')
      ON CONFLICT (email) DO NOTHING
    `, [staffHash]);

    // Rooms
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

    for (const r of rooms) {
      await client.query(`
        INSERT INTO rooms (room_number, floor, type, status, price_night, capacity, description, amenities)
        VALUES ($1, $2, $3, 'available', $4, $5, $6, $7)
        ON CONFLICT (room_number) DO NOTHING
      `, [
        r.number, r.floor, r.type, r.price, r.capacity, r.desc,
        JSON.stringify({ wifi: true, ac: true, tv: true, minibar: r.type !== 'standard', safe: true })
      ]);
    }

    // Sample customers
    const customers = [
      { name: 'James Mwangi', email: 'james.mwangi@email.com', phone: '+254712345678', id_number: 'KE12345678', nationality: 'Kenyan', tier: 'vip', total_stays: 12 },
      { name: 'Amina Hassan', email: 'amina.hassan@email.com', phone: '+254723456789', id_number: 'KE23456789', nationality: 'Kenyan', tier: 'regular', total_stays: 4 },
      { name: 'David Ochieng', email: 'david.ochieng@email.com', phone: '+254734567890', id_number: 'KE34567890', nationality: 'Kenyan', tier: 'new', total_stays: 1 },
    ];

    for (const c of customers) {
      await client.query(`
        INSERT INTO customers (full_name, email, phone, id_number, nationality, tier, total_stays)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT DO NOTHING
      `, [c.name, c.email, c.phone, c.id_number, c.nationality, c.tier, c.total_stays]);
    }

    console.log('✅ Database seeded successfully');
    console.log('   Admin: admin@tsthotels.com / TST@Admin2026');
    console.log('   Staff: staff@tsthotels.com / Staff@2026');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(process.exit.bind(process, 1));
