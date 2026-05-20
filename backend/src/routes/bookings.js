const express = require('express');
const { z } = require('zod');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const bookingSchema = z.object({
  room_id: z.string().uuid(),
  check_in: z.string(),
  check_out: z.string(),
  guests: z.number().int().min(1).default(1),
  special_requests: z.string().optional(),
  // Guest info for new customers
  customer_id: z.string().uuid().optional(),
  guest_name: z.string().optional(),
  guest_email: z.string().email().optional(),
  guest_phone: z.string().optional(),
  guest_id_number: z.string().optional()
});

// GET /bookings - staff only
router.get('/', authenticate, requireRole('admin','manager','staff'), async (req, res) => {
  try {
    const { status, from, to, customer_id } = req.query;
    let query = `
      SELECT b.*, c.full_name as customer_name, c.email as customer_email,
             c.phone as customer_phone, c.tier as customer_tier,
             r.room_number, r.type as room_type, r.floor as room_floor
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { params.push(status); query += ` AND b.status = $${params.length}`; }
    if (from) { params.push(from); query += ` AND b.check_in >= $${params.length}`; }
    if (to) { params.push(to); query += ` AND b.check_out <= $${params.length}`; }
    if (customer_id) { params.push(customer_id); query += ` AND b.customer_id = $${params.length}`; }
    query += ' ORDER BY b.created_at DESC';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /bookings/:id
router.get('/:id', authenticate, requireRole('admin','manager','staff'), async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT b.*, c.full_name as customer_name, c.email as customer_email,
             c.phone as customer_phone, c.id_number as customer_id_number, c.tier,
             r.room_number, r.type as room_type, r.floor, r.price_night, r.amenities
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.id = $1
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Booking not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// POST /bookings - public (create booking)
router.post('/', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const data = bookingSchema.parse(req.body);
    await client.query('BEGIN');

    // Check room availability
    const { rows: conflicts } = await client.query(`
      SELECT id FROM bookings
      WHERE room_id = $1 AND status NOT IN ('cancelled','checked_out')
      AND check_in < $3 AND check_out > $2
    `, [data.room_id, data.check_in, data.check_out]);
    if (conflicts.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Room is not available for selected dates' });
    }

    // Get or create customer
    let customerId = data.customer_id;
    if (!customerId && data.guest_name) {
      let { rows: existing } = await client.query(
        'SELECT id FROM customers WHERE email = $1', [data.guest_email]
      );
      if (existing[0]) {
        customerId = existing[0].id;
      } else {
        const { rows: newCustomer } = await client.query(`
          INSERT INTO customers (full_name, email, phone, id_number)
          VALUES ($1,$2,$3,$4) RETURNING id
        `, [data.guest_name, data.guest_email, data.guest_phone, data.guest_id_number]);
        customerId = newCustomer[0].id;
      }
    }

    // Calculate total
    const { rows: roomRows } = await client.query('SELECT price_night FROM rooms WHERE id=$1', [data.room_id]);
    if (!roomRows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Room not found' }); }
    const nights = Math.ceil((new Date(data.check_out) - new Date(data.check_in)) / 86400000);
    const totalAmount = roomRows[0].price_night * nights;

    const { rows } = await client.query(`
      INSERT INTO bookings (customer_id, room_id, check_in, check_out, guests, total_amount, special_requests)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [customerId, data.room_id, data.check_in, data.check_out, data.guests, totalAmount, data.special_requests]);

    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Failed to create booking' });
  } finally {
    client.release();
  }
});

// Status update helpers
const updateStatus = (newStatus) => async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *`,
      [newStatus, req.params.id]
    );
    if (!rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Booking not found' }); }
    // Update room status
    if (newStatus === 'checked_in') {
      await client.query(`UPDATE rooms SET status='occupied' WHERE id=$1`, [rows[0].room_id]);
    } else if (newStatus === 'checked_out' || newStatus === 'cancelled') {
      await client.query(`UPDATE rooms SET status='available' WHERE id=$1`, [rows[0].room_id]);
      if (newStatus === 'checked_out') {
        await client.query(`UPDATE customers SET total_stays = total_stays + 1,
          tier = CASE WHEN total_stays + 1 >= 10 THEN 'vip' WHEN total_stays + 1 >= 3 THEN 'regular' ELSE tier END
          WHERE id = $1`, [rows[0].customer_id]);
      }
    }
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to update booking' });
  } finally {
    client.release();
  }
};

router.put('/:id/confirm', authenticate, requireRole('admin','manager','staff'), updateStatus('confirmed'));
router.put('/:id/checkin', authenticate, requireRole('admin','manager','staff'), updateStatus('checked_in'));
router.put('/:id/checkout', authenticate, requireRole('admin','manager','staff'), updateStatus('checked_out'));
router.put('/:id/cancel', authenticate, requireRole('admin','manager','staff'), updateStatus('cancelled'));

module.exports = router;
