const { Schema, model } = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { baseSchemaOptions } = require('./base');

const customerSchema = new Schema({
  _id: { type: String, default: uuidv4 },
  full_name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  id_number: { type: String, trim: true },
  nationality: { type: String, trim: true },
  tier: { type: String, enum: ['new', 'regular', 'vip'], default: 'new' },
  total_stays: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
}, baseSchemaOptions);

module.exports = model('Customer', customerSchema);