const express = require('express');
const db = require('../db');

const router = express.Router();

// POST /payments/stripe - process card payment
router.post('/stripe', async (req, res) => {
  try {
    const { invoice_id, payment_method_id } = req.body;
    if (!invoice_id) return res.status(400).json({ error: 'invoice_id is required' });

    const { rows: invoiceRows } = await db.query('SELECT * FROM invoices WHERE id=$1', [invoice_id]);
    if (!invoiceRows[0]) return res.status(404).json({ error: 'Invoice not found' });
    const invoice = invoiceRows[0];
    if (invoice.payment_status === 'paid') {
      return res.status(409).json({ error: 'Invoice already paid' });
    }

    // In production: use Stripe SDK here
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({...})
    // For now: simulate successful payment
    const simulatedStripeId = `pi_sim_${Date.now()}`;

    await db.query(`
      UPDATE invoices
      SET payment_status='paid', payment_method='card', stripe_id=$1, paid_at=NOW()
      WHERE id=$2
    `, [simulatedStripeId, invoice_id]);

    // Confirm booking
    await db.query(`UPDATE bookings SET status='confirmed' WHERE id=$1 AND status='pending'`, [invoice.booking_id]);

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
    const { rows } = await db.query('SELECT * FROM invoices WHERE id=$1', [invoice_id]);
    if (!rows[0]) return res.status(404).json({ error: 'Invoice not found' });

    // In production: call Daraja API here
    // For now: simulate pending STK push
    const mpesaRef = `MPE${Date.now()}`;
    await db.query(`UPDATE invoices SET mpesa_ref=$1, payment_method='mobile_money' WHERE id=$2`,
      [mpesaRef, invoice_id]);

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
        await db.query(`
          UPDATE invoices SET payment_status='paid', paid_at=NOW()
          WHERE mpesa_ref LIKE $1
        `, [`%${mpesaRef.substring(0,6)}%`]);
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
    const { rows } = await db.query(`
      UPDATE invoices SET payment_status='paid', payment_method='cash', paid_at=NOW()
      WHERE id=$1 RETURNING *
    `, [invoice_id]);
    if (!rows[0]) return res.status(404).json({ error: 'Invoice not found' });
    await db.query(`UPDATE bookings SET status='confirmed' WHERE id=$1 AND status='pending'`, [rows[0].booking_id]);
    res.json({ success: true, invoice: rows[0] });
  } catch {
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

module.exports = router;
