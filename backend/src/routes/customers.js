const express = require('express');
const { z } = require('zod');
const Customer = require('../models/Customer');
const Booking = require('../models/Booking');
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

const formatBooking = (booking) => {
  const data = booking.toObject ? booking.toObject() : booking;
  const room = data.room_id && typeof data.room_id === 'object' ? data.room_id : null;
  return {
    ...data,
    room_id: room ? room.id : data.room_id,
    room_number: room?.room_number || null,
    room_type: room?.type || null,
  };
};

// GET /customers
router.get('/', authenticate, requireRole('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const { search, tier } = req.query;
    const match = { is_active: true };
    if (tier) {
      match.tier = tier;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      match.$or = [
        { full_name: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    const customers = await Customer.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'bookings',
          let: { customerId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$customer_id', '$$customerId'] },
                    { $eq: ['$status', 'checked_out'] }
                  ]
                }
              }
            },
            { $sort: { created_at: -1 } }
          ],
          as: 'booking_history'
        }
      },
      {
        $addFields: {
          booking_count: { $size: '$booking_history' },
          last_stay: { $max: '$booking_history.check_out' }
        }
      },
      { $sort: { created_at: -1 } },
      { $project: { booking_history: 0 } }
    ]);

    res.json(customers);
  } catch {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /customers/:id
router.get('/:id', authenticate, requireRole('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const bookings = await Booking.find({ customer_id: req.params.id })
      .sort({ created_at: -1 })
      .populate('room_id', 'room_number type');

    res.json({
      ...customer.toJSON(),
      bookings: bookings.map(formatBooking),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST /customers
router.post('/', authenticate, requireRole('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const data = customerSchema.parse(req.body);
    const customer = await Customer.create({
      full_name: data.full_name,
      email: data.email?.toLowerCase(),
      phone: data.phone,
      id_number: data.id_number,
      nationality: data.nationality,
      notes: data.notes,
    });
    res.status(201).json(customer);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    if (err.code === 11000) return res.status(409).json({ error: 'Customer already exists' });
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// PUT /customers/:id
router.put('/:id', authenticate, requireRole('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const data = customerSchema.partial().parse(req.body);
    if (data.email) {
      data.email = data.email.toLowerCase();
    }
    if (!Object.keys(data).length) return res.status(400).json({ error: 'No fields to update' });

    const customer = await Customer.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });

    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE /customers/:id (soft delete) - admin only
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true }
    );
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer deactivated' });
  } catch {
    res.status(500).json({ error: 'Failed to deactivate customer' });
  }
});

module.exports = router;