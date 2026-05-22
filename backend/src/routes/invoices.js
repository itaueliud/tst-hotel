const express = require('express');
const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const Counter = require('../models/Counter');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const formatInvoice = (invoice) => {
  const data = invoice.toObject ? invoice.toObject() : invoice;
  const booking = data.booking_id && typeof data.booking_id === 'object' ? data.booking_id : null;
  const customer = booking?.customer_id && typeof booking.customer_id === 'object' ? booking.customer_id : null;
  const room = booking?.room_id && typeof booking.room_id === 'object' ? booking.room_id : null;

  return {
    ...data,
    booking_id: booking ? booking.id : data.booking_id,
    check_in: booking?.check_in || null,
    check_out: booking?.check_out || null,
    guests: booking?.guests || null,
    special_requests: booking?.special_requests || null,
    customer_name: customer?.full_name || null,
    customer_email: customer?.email || null,
    customer_phone: customer?.phone || null,
    room_number: room?.room_number || null,
    room_type: room?.type || null,
    floor: room?.floor || null,
  };
};

const nextInvoiceNumber = async () => {
  const counter = await Counter.findByIdAndUpdate(
    'invoice',
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `INV-${String(counter.seq).padStart(5, '0')}`;
};

// GET /invoices
router.get('/', authenticate, requireRole('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const { status, method, from, to } = req.query;
    const filter = {};
    if (status) filter.payment_status = status;
    if (method) filter.payment_method = method;
    if (from || to) {
      filter.created_at = {};
      if (from) filter.created_at.$gte = new Date(from);
      if (to) filter.created_at.$lte = new Date(to);
    }

    const invoices = await Invoice.find(filter)
      .sort({ created_at: -1 })
      .populate({
        path: 'booking_id',
        populate: [
          { path: 'customer_id', select: 'full_name email phone' },
          { path: 'room_id', select: 'room_number type' },
        ],
      });

    res.json(invoices.map(formatInvoice));
  } catch {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// GET /invoices/:id
router.get('/:id', authenticate, requireRole('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate({
      path: 'booking_id',
      populate: [
        { path: 'customer_id', select: 'full_name email phone id_number' },
        { path: 'room_id', select: 'room_number type floor' },
      ],
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(formatInvoice(invoice));
  } catch {
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// POST /invoices/generate
router.post('/generate', authenticate, requireRole('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const { booking_id, payment_method, notes } = req.body;
    const booking = await Booking.findById(booking_id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const existing = await Invoice.findOne({ booking_id });
    if (existing) return res.status(409).json({ error: 'Invoice already exists for this booking' });

    const tax = booking.total_amount * 0.16;
    const invoiceNumber = await nextInvoiceNumber();

    const invoice = await Invoice.create({
      booking_id,
      invoice_number: invoiceNumber,
      amount: booking.total_amount,
      tax,
      payment_method: payment_method || 'cash',
      notes,
    });

    res.status(201).json(invoice);
  } catch {
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// POST /invoices/:id/refund
router.post('/:id/refund', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, payment_status: 'paid' },
      { payment_status: 'refunded' },
      { new: true }
    );

    if (!invoice) return res.status(404).json({ error: 'Invoice not found or not eligible for refund' });
    res.json(invoice);
  } catch {
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

module.exports = router;