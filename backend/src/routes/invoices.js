const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /invoices
router.get('/', authenticate, requireRole('admin','manager','staff'), async (req, res) => {
  try {
    const { status, method, from, to } = req.query;
    let query = `
      SELECT i.*, b.check_in, b.check_out, b.guests,
             c.full_name as customer_name, c.email as customer_email,
             r.room_number, r.type as room_type
      FROM invoices i
      JOIN bookings b ON i.booking_id = b.id
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { params.push(status); query += ` AND i.payment_status = $${params.length}`; }
    if (method) { params.push(method); query += ` AND i.payment_method = $${params.length}`; }
    if (from) { params.push(from); query += ` AND i.created_at >= $${params.length}`; }
    if (to) { params.push(to); query += ` AND i.created_at <= $${params.length}`; }
    query += ' ORDER BY i.created_at DESC';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// GET /invoices/:id
router.get('/:id', authenticate, requireRole('admin','manager','staff'), async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT i.*, b.check_in, b.check_out, b.guests, b.special_requests,
             c.full_name as customer_name, c.email as customer_email, c.phone as customer_phone,
             r.room_number, r.type as room_type, r.floor
      FROM invoices i
      JOIN bookings b ON i.booking_id = b.id
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE i.id = $1
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Invoice not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// POST /invoices/generate
router.post('/generate', authenticate, requireRole('admin','manager','staff'), async (req, res) => {
  try {
    const { booking_id, payment_method, notes } = req.body;
    const { rows: bookingRows } = await db.query('SELECT * FROM bookings WHERE id=$1', [booking_id]);
    if (!bookingRows[0]) return res.status(404).json({ error: 'Booking not found' });
    // Check no invoice exists
    const { rows: existing } = await db.query('SELECT id FROM invoices WHERE booking_id=$1', [booking_id]);
    if (existing[0]) return res.status(409).json({ error: 'Invoice already exists for this booking' });
    const booking = bookingRows[0];
    const tax = booking.total_amount * 0.16; // 16% VAT
    const { rows: seqRows } = await db.query(`SELECT nextval('invoice_seq') as seq`);
    const invoiceNumber = `INV-${String(seqRows[0].seq).padStart(5, '0')}`;
    const { rows } = await db.query(`
      INSERT INTO invoices (booking_id, invoice_number, amount, tax, payment_method, notes)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [booking_id, invoiceNumber, booking.total_amount, tax, payment_method || 'cash', notes]);
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// POST /invoices/:id/refund
router.post('/:id/refund', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE invoices SET payment_status='refunded' WHERE id=$1 AND payment_status='paid' RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Invoice not found or not eligible for refund' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

module.exports = router;
