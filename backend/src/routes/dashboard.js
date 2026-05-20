const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /dashboard/stats
router.get('/stats', authenticate, requireRole('admin','manager','staff'), async (req, res) => {
  try {
    const [rooms, bookings, revenue, customers] = await Promise.all([
      db.query(`SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status='available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status='occupied' THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN status='maintenance' THEN 1 ELSE 0 END) as maintenance
        FROM rooms`),
      db.query(`SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status='confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status='checked_in' THEN 1 ELSE 0 END) as checked_in,
        SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 ELSE 0 END) as today
        FROM bookings`),
      db.query(`SELECT
        COALESCE(SUM(amount), 0) as total,
        COALESCE(SUM(CASE WHEN payment_status='paid' THEN amount ELSE 0 END), 0) as paid,
        COALESCE(SUM(CASE WHEN payment_status='pending' THEN amount ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN payment_status='refunded' THEN amount ELSE 0 END), 0) as refunded,
        COALESCE(SUM(CASE WHEN DATE(paid_at) = CURRENT_DATE AND payment_status='paid' THEN amount ELSE 0 END), 0) as today
        FROM invoices`),
      db.query(`SELECT
        COUNT(*) as total,
        SUM(CASE WHEN tier='vip' THEN 1 ELSE 0 END) as vip,
        SUM(CASE WHEN tier='regular' THEN 1 ELSE 0 END) as regular,
        SUM(CASE WHEN tier='new' THEN 1 ELSE 0 END) as new_guests
        FROM customers WHERE is_active=true`)
    ]);
    res.json({
      rooms: rooms.rows[0],
      bookings: bookings.rows[0],
      revenue: revenue.rows[0],
      customers: customers.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /dashboard/recent-bookings
router.get('/recent-bookings', authenticate, requireRole('admin','manager','staff'), async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT b.id, b.check_in, b.check_out, b.status, b.total_amount, b.created_at,
             c.full_name as customer_name, r.room_number, r.type as room_type
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN rooms r ON b.room_id = r.id
      ORDER BY b.created_at DESC LIMIT 10
    `);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch recent bookings' });
  }
});

// GET /dashboard/weekly-revenue
router.get('/weekly-revenue', authenticate, requireRole('admin','manager','staff'), async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT DATE(paid_at) as date,
             COALESCE(SUM(amount), 0) as revenue,
             COUNT(*) as transactions
      FROM invoices
      WHERE payment_status = 'paid'
        AND paid_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(paid_at)
      ORDER BY date
    `);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch weekly revenue' });
  }
});

module.exports = router;
