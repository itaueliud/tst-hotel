const express = require('express');
const { z } = require('zod');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const customerSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  id_number: z.string().optional(),
  nationality: z.string().optional(),
  notes: z.string().optional()
});

// GET /customers
router.get('/', authenticate, requireRole('admin','manager','staff'), async (req, res) => {
  try {
    const { search, tier } = req.query;
    let query = `
      SELECT c.*, COUNT(b.id) as booking_count,
             MAX(b.check_out) as last_stay
      FROM customers c
      LEFT JOIN bookings b ON c.id = b.customer_id AND b.status = 'checked_out'
      WHERE c.is_active = true
    `;
    const params = [];
    if (tier) { params.push(tier); query += ` AND c.tier = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (c.full_name ILIKE $${params.length} OR c.email ILIKE $${params.length} OR c.phone ILIKE $${params.length})`;
    }
    query += ' GROUP BY c.id ORDER BY c.created_at DESC';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /customers/:id
router.get('/:id', authenticate, requireRole('admin','manager','staff'), async (req, res) => {
  try {
    const { rows: customers } = await db.query('SELECT * FROM customers WHERE id=$1', [req.params.id]);
    if (!customers[0]) return res.status(404).json({ error: 'Customer not found' });
    const { rows: bookings } = await db.query(`
      SELECT b.*, r.room_number, r.type as room_type
      FROM bookings b JOIN rooms r ON b.room_id = r.id
      WHERE b.customer_id = $1 ORDER BY b.created_at DESC
    `, [req.params.id]);
    res.json({ ...customers[0], bookings });
  } catch {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST /customers
router.post('/', authenticate, requireRole('admin','manager','staff'), async (req, res) => {
  try {
    const data = customerSchema.parse(req.body);
    const { rows } = await db.query(`
      INSERT INTO customers (full_name, email, phone, id_number, nationality, notes)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [data.full_name, data.email, data.phone, data.id_number, data.nationality, data.notes]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// PUT /customers/:id
router.put('/:id', authenticate, requireRole('admin','manager','staff'), async (req, res) => {
  try {
    const data = customerSchema.partial().parse(req.body);
    const fields = Object.keys(data).map((k, i) => `${k} = $${i + 1}`);
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    const params = [...Object.values(data), req.params.id];
    const { rows } = await db.query(
      `UPDATE customers SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!rows[0]) return res.status(404).json({ error: 'Customer not found' });
    res.json(rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE /customers/:id (soft delete) - admin only
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE customers SET is_active = false WHERE id=$1 RETURNING id`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer deactivated' });
  } catch {
    res.status(500).json({ error: 'Failed to deactivate customer' });
  }
});

module.exports = router;
