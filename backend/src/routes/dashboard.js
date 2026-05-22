const express = require('express');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const formatBooking = (booking) => {
  const data = booking.toObject ? booking.toObject() : booking;
  const customer = data.customer_id && typeof data.customer_id === 'object' ? data.customer_id : null;
  const room = data.room_id && typeof data.room_id === 'object' ? data.room_id : null;

  return {
    ...data,
    customer_name: customer?.full_name || null,
    room_number: room?.room_number || null,
    room_type: room?.type || null,
  };
};

// GET /dashboard/stats
router.get('/stats', authenticate, requireRole('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const [rooms, bookings, revenue, customers] = await Promise.all([
      Room.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
            occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
            maintenance: { $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } },
          }
        }
      ]),
      Booking.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
            checked_in: { $sum: { $cond: [{ $eq: ['$status', 'checked_in'] }, 1, 0] } },
            today: {
              $sum: {
                $cond: [
                  { $gte: ['$created_at', new Date(new Date().setHours(0, 0, 0, 0))] },
                  1,
                  0,
                ]
              }
            },
          }
        }
      ]),
      Invoice.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            paid: { $sum: { $cond: [{ $eq: ['$payment_status', 'paid'] }, '$amount', 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$payment_status', 'pending'] }, '$amount', 0] } },
            refunded: { $sum: { $cond: [{ $eq: ['$payment_status', 'refunded'] }, '$amount', 0] } },
            today: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$payment_status', 'paid'] },
                      { $gte: ['$paid_at', new Date(new Date().setHours(0, 0, 0, 0))] },
                    ]
                  },
                  '$amount',
                  0,
                ]
              }
            },
          }
        }
      ]),
      Customer.aggregate([
        {
          $match: { is_active: true }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            vip: { $sum: { $cond: [{ $eq: ['$tier', 'vip'] }, 1, 0] } },
            regular: { $sum: { $cond: [{ $eq: ['$tier', 'regular'] }, 1, 0] } },
            new_guests: { $sum: { $cond: [{ $eq: ['$tier', 'new'] }, 1, 0] } },
          }
        }
      ])
    ]);

    res.json({
      rooms: rooms[0] || { total: 0, available: 0, occupied: 0, maintenance: 0 },
      bookings: bookings[0] || { total: 0, pending: 0, confirmed: 0, checked_in: 0, today: 0 },
      revenue: revenue[0] || { total: 0, paid: 0, pending: 0, refunded: 0, today: 0 },
      customers: customers[0] || { total: 0, vip: 0, regular: 0, new_guests: 0 },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /dashboard/recent-bookings
router.get('/recent-bookings', authenticate, requireRole('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const bookings = await Booking.find()
      .sort({ created_at: -1 })
      .limit(10)
      .populate('customer_id', 'full_name')
      .populate('room_id', 'room_number type');

    res.json(bookings.map(formatBooking));
  } catch {
    res.status(500).json({ error: 'Failed to fetch recent bookings' });
  }
});

// GET /dashboard/weekly-revenue
router.get('/weekly-revenue', authenticate, requireRole('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const rows = await Invoice.aggregate([
      {
        $match: {
          payment_status: 'paid',
          paid_at: { $gte: weekAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paid_at' } },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', revenue: 1, transactions: 1, _id: 0 } }
    ]);

    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch weekly revenue' });
  }
});

module.exports = router;