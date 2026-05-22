const { Schema, model } = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { baseSchemaOptions } = require('./base');

const bookingSchema = new Schema({
  _id: { type: String, default: uuidv4 },
  customer_id: { type: String, ref: 'Customer', default: null },
  room_id: { type: String, ref: 'Room', required: true },
  check_in: { type: String, required: true },
  check_out: { type: String, required: true },
  guests: { type: Number, default: 1 },
  status: { type: String, enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'], default: 'pending' },
  total_amount: { type: Number, default: 0 },
  special_requests: { type: String, default: '' },
}, baseSchemaOptions);

module.exports = model('Booking', bookingSchema);