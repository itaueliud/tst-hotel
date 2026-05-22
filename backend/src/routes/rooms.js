const express = require('express');
const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
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
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (floor) filter.floor = Number.parseInt(floor, 10);
    const rooms = await Room.find(filter).sort({ floor: 1, room_number: 1 });
    res.json(rooms);
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

    const overlappingBookings = await Booking.find({
      status: { $nin: ['cancelled', 'checked_out'] },
      check_in: { $lt: check_out },
      check_out: { $gt: check_in },
    }).distinct('room_id');

    const filter = {
      status: 'available',
      _id: { $nin: overlappingBookings },
    };

    if (guests) {
      filter.capacity = { $gte: Number.parseInt(guests, 10) };
    }

    if (type) {
      filter.type = type;
    }

    const rooms = await Room.find(filter).sort({ price_night: 1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// GET /rooms/:id
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch {
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// POST /rooms - admin only
router.post('/', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const data = roomSchema.parse(req.body);
    const room = await Room.create({
      _id: uuidv4(),
      room_number: data.room_number,
      floor: data.floor,
      type: data.type,
      price_night: data.price_night,
      capacity: data.capacity,
      description: data.description || null,
      amenities: data.amenities || {},
    });
    res.status(201).json(room);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    if (err.code === 11000) return res.status(409).json({ error: 'Room number already exists' });
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// PUT /rooms/:id - staff+
router.put('/:id', authenticate, requireRole('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const { status, price_night, description, amenities } = req.body;
    const update = {};
    if (status) update.status = status;
    if (price_night) update.price_night = price_night;
    if (description !== undefined) update.description = description;
    if (amenities) update.amenities = amenities;
    if (!Object.keys(update).length) return res.status(400).json({ error: 'No fields to update' });

    const room = await Room.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch {
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// DELETE /rooms/:id - admin only
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ message: 'Room deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

module.exports = router;