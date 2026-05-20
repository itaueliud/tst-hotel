const express = require('express');
const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const roomSchema = z.object({
  room_number: z.string().min(1).max(10),
  floor: z.number().int().min(1),
  type: z.enum(['standard', 'deluxe', 'suite', 'executive']),
  price_night: z.number().positive(),
  capacity: z.number().int().min(1).default(2),
  description: z.string().optional(),
  amenities: z.object({
    wifi: z.boolean().default(true),
    ac: z.boolean().default(true),
    tv: z.boolean().default(true),
    minibar: z.boolean().default(false),
    safe: z.boolean().default(false),
    balcony: z.boolean().default(false),
    bathtub: z.boolean().default(false)
  }).optional()
});

// GET /rooms - list all rooms (public)
router.get('/', async (req, res) => {
  try {
    const { type, status, floor } = req.query;
    let query = 'SELECT * FROM rooms WHERE 1=1';
    const params = [];
    if (type) { params.push(type); query += ` AND type = $${params.length}`; }
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    if (floor) { params.push(parseInt(floor)); query += ` AND floor = $${params.length}`; }
    query += ' ORDER BY floor, room_number';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// GET /rooms/available - check availability (public)
router.get('/available', async (req, res) => {
  try {
    const { check_in, check_out, guests, type } = req.query;
    if (!check_in || !check_out) {
      return res.status(400).json({ error: 'check_in and check_out are required' });
    }
    let query = `
      SELECT r.* FROM rooms r
      WHERE r.status = 'available'
      AND r.id NOT IN (
        SELECT b.room_id FROM bookings b
        WHERE b.status NOT IN ('cancelled', 'checked_out')
        AND b.check_in < $2 AND b.check_out > $1
      )
    `;
    const params = [check_in, check_out];
    if (guests) { params.push(parseInt(guests)); query += ` AND r.capacity >= $${params.length}`; }
    if (type) { params.push(type); query += ` AND r.type = $${params.length}`; }
    query += ' ORDER BY r.price_night';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// GET /rooms/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM rooms WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Room not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// POST /rooms - admin only
router.post('/', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const data = roomSchema.parse(req.body);
    const { rows } = await db.query(`
      INSERT INTO rooms (room_number, floor, type, price_night, capacity, description, amenities)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `, [data.room_number, data.floor, data.type, data.price_night, data.capacity,
        data.description || null, JSON.stringify(data.amenities || {})]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    if (err.code === '23505') return res.status(409).json({ error: 'Room number already exists' });
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// PUT /rooms/:id - staff+
router.put('/:id', authenticate, requireRole('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const { status, price_night, description, amenities } = req.body;
    const fields = [];
    const params = [];
    if (status) { params.push(status); fields.push(`status = $${params.length}`); }
    if (price_night) { params.push(price_night); fields.push(`price_night = $${params.length}`); }
    if (description !== undefined) { params.push(description); fields.push(`description = $${params.length}`); }
    if (amenities) { params.push(JSON.stringify(amenities)); fields.push(`amenities = $${params.length}`); }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);
    const { rows } = await db.query(
      `UPDATE rooms SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!rows[0]) return res.status(404).json({ error: 'Room not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// DELETE /rooms/:id - admin only
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM rooms WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Room not found' });
    res.json({ message: 'Room deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

module.exports = router;
