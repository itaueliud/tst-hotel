const express = require('express');
const { z } = require('zod');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Customer = require('../models/Customer');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const bookingSchema = z.object({
  room_id: z.string().uuid(),
  check_in: z.string(),
  check_out: z.string(),
  guests: z.number().int().min(1).default(1),
  special_requests: z.string().optional(),
  customer_id: z.string().uuid().optional(),
  guest_name: z.string().optional(),
  guest_email: z.string().email().optional(),
  guest_phone: z.string().optional(),
  guest_id_number: z.string().optional()
});

const formatBooking = (booking) => {
  if (!booking) return booking;
  const data = booking.toObject ? booking.toObject() : booking;
  const customer = data.customer_id && typeof data.customer_id === 'object' ? data.customer_id : null;
  const room = data.room_id && typeof data.room_id === 'object' ? data.room_id : null;

  return {
    ...data,
    customer_id: customer ? customer.id : data.customer_id || null,
    room_id: room ? room.id : data.room_id || null,
    customer_name: customer?.full_name || null,
    customer_email: customer?.email || null,
    customer_phone: customer?.phone || null,
    customer_tier: customer?.tier || null,
    customer_id_number: customer?.id_number || null,
    room_number: room?.room_number || null,
    room_type: room?.type || null,
    room_floor: room?.floor || null,
    price_night: room?.price_night || null,
    amenities: room?.amenities || null,
  };
};

// GET /bookings - staff only
router.get('/', authenticate, requireRole('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const { status, from, to, customer_id } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (from) filter.check_in = { ...(filter.check_in || {}), $gte: from };
    if (to) filter.check_out = { ...(filter.check_out || {}), $lte: to };
    if (customer_id) filter.customer_id = customer_id;

    const bookings = await Booking.find(filter)
      .sort({ created_at: -1 })
      .populate('customer_id', 'full_name email phone tier id_number')
      .populate('room_id', 'room_number type floor price_night amenities');

    res.json(bookings.map(formatBooking));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /bookings/:id
router.get('/:id', authenticate, requireRole('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer_id', 'full_name email phone id_number tier')
      .populate('room_id', 'room_number type floor price_night amenities');

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(formatBooking(booking));
  } catch {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// POST /bookings - public (create booking)
router.post('/', async (req, res) => {
  try {
    const data = bookingSchema.parse(req.body);

    const conflictingBooking = await Booking.findOne({
      room_id: data.room_id,
      status: { $nin: ['cancelled', 'checked_out'] },
      check_in: { $lt: data.check_out },
      check_out: { $gt: data.check_in },
    });

    if (conflictingBooking) {
      return res.status(409).json({ error: 'Room is not available for selected dates' });
    }

    let customerId = data.customer_id || null;
    if (!customerId && data.guest_name) {
      let existingCustomer = null;
      if (data.guest_email) {
        existingCustomer = await Customer.findOne({ email: data.guest_email.toLowerCase() });
      }

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const customer = await Customer.create({
          full_name: data.guest_name,
          email: data.guest_email?.toLowerCase(),
          phone: data.guest_phone,
          id_number: data.guest_id_number,
        });
        customerId = customer.id;
      }
    }

    const room = await Room.findById(data.room_id).select('price_night');
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const nights = Math.ceil((new Date(data.check_out) - new Date(data.check_in)) / 86400000);
    const totalAmount = room.price_night * nights;

    const booking = await Booking.create({
      customer_id: customerId,
      room_id: data.room_id,
      check_in: data.check_in,
      check_out: data.check_out,
      guests: data.guests,
      total_amount: totalAmount,
      special_requests: data.special_requests,
    });

    res.status(201).json(booking);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

const updateStatus = (newStatus) => async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.status = newStatus;
    await booking.save();

    if (newStatus === 'checked_in') {
      await Room.findByIdAndUpdate(booking.room_id, { status: 'occupied' });
    } else if (newStatus === 'checked_out' || newStatus === 'cancelled') {
      await Room.findByIdAndUpdate(booking.room_id, { status: 'available' });

      if (newStatus === 'checked_out' && booking.customer_id) {
        const customer = await Customer.findById(booking.customer_id);
        if (customer) {
          customer.total_stays += 1;
          if (customer.total_stays >= 10) {
            customer.tier = 'vip';
          } else if (customer.total_stays >= 3) {
            customer.tier = 'regular';
          }
          await customer.save();
        }
      }
    }

    res.json(booking);
  } catch {
    res.status(500).json({ error: 'Failed to update booking' });
  }
};

router.put('/:id/confirm', authenticate, requireRole('admin', 'manager', 'staff'), updateStatus('confirmed'));
router.put('/:id/checkin', authenticate, requireRole('admin', 'manager', 'staff'), updateStatus('checked_in'));
router.put('/:id/checkout', authenticate, requireRole('admin', 'manager', 'staff'), updateStatus('checked_out'));
router.put('/:id/cancel', authenticate, requireRole('admin', 'manager', 'staff'), updateStatus('cancelled'));

module.exports = router;