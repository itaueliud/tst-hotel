const { Schema, model } = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { baseSchemaOptions } = require('./base');

const invoiceSchema = new Schema({
  _id: { type: String, default: uuidv4 },
  booking_id: { type: String, ref: 'Booking', required: true, unique: true },
  invoice_number: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  payment_method: { type: String, enum: ['card', 'mobile_money', 'cash', 'bank_transfer'] },
  payment_status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paid_at: { type: Date, default: null },
  stripe_id: { type: String, default: '' },
  mpesa_ref: { type: String, default: '' },
  notes: { type: String, default: '' },
}, baseSchemaOptions);

module.exports = model('Invoice', invoiceSchema);