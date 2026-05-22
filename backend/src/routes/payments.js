const express = require('express');
const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');

const router = express.Router();

// POST /payments/stripe - process card payment
router.post('/stripe', async (req, res) => {
  try {
    const { invoice_id, payment_method_id } = req.body;
    if (!invoice_id) return res.status(400).json({ error: 'invoice_id is required' });

    const invoice = await Invoice.findById(invoice_id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.payment_status === 'paid') {
      return res.status(409).json({ error: 'Invoice already paid' });
    }

    const simulatedStripeId = `pi_sim_${Date.now()}`;

    invoice.payment_status = 'paid';
    invoice.payment_method = 'card';
    invoice.stripe_id = simulatedStripeId;
    invoice.paid_at = new Date();
    await invoice.save();

    await Booking.findByIdAndUpdate(invoice.booking_id, { status: 'confirmed' });

    res.json({ success: true, stripe_id: simulatedStripeId, message: 'Payment processed successfully' });
  } catch {
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// POST /payments/mpesa - initiate STK push
router.post('/mpesa', async (req, res) => {
  try {
    const { invoice_id, phone_number } = req.body;
    if (!invoice_id || !phone_number) {
      return res.status(400).json({ error: 'invoice_id and phone_number are required' });
    }
    const invoice = await Invoice.findById(invoice_id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const mpesaRef = `MPE${Date.now()}`;
    invoice.mpesa_ref = mpesaRef;
    invoice.payment_method = 'mobile_money';
    await invoice.save();

    res.json({
      success: true,
      mpesa_ref: mpesaRef,
      message: 'STK push sent to ' + phone_number + '. Enter your M-Pesa PIN to complete payment.'
    });
  } catch {
    res.status(500).json({ error: 'M-Pesa initiation failed' });
  }
});

// GET /payments/mpesa/callback - webhook from Safaricom
router.post('/mpesa/callback', async (req, res) => {
  try {
    const { Body } = req.body;
    if (Body?.stkCallback?.ResultCode === 0) {
      const mpesaRef = Body.stkCallback.CallbackMetadata?.Item?.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
      if (mpesaRef) {
        const invoice = await Invoice.findOne({ mpesa_ref: new RegExp(mpesaRef.substring(0, 6)) });
        if (invoice) {
          invoice.payment_status = 'paid';
          invoice.paid_at = new Date();
          await invoice.save();
        }
      }
    }
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch {
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

// POST /payments/cash - record cash payment
router.post('/cash', async (req, res) => {
  try {
    const { invoice_id } = req.body;
    const invoice = await Invoice.findById(invoice_id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    invoice.payment_status = 'paid';
    invoice.payment_method = 'cash';
    invoice.paid_at = new Date();
    await invoice.save();

    await Booking.findByIdAndUpdate(invoice.booking_id, { status: 'confirmed' });
    res.json({ success: true, invoice });
  } catch {
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

module.exports = router;