const { Schema, model } = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { baseSchemaOptions } = require('./base');

const roomSchema = new Schema({
  _id: { type: String, default: uuidv4 },
  room_number: { type: String, required: true, unique: true, trim: true },
  floor: { type: Number, required: true },
  type: { type: String, enum: ['standard', 'deluxe', 'suite', 'executive'], required: true },
  status: { type: String, enum: ['available', 'occupied', 'maintenance'], default: 'available' },
  price_night: { type: Number, required: true },
  capacity: { type: Number, default: 2 },
  description: { type: String, default: '' },
  amenities: { type: Schema.Types.Mixed, default: {} },
  image_urls: { type: [String], default: [] },
}, baseSchemaOptions);

module.exports = model('Room', roomSchema);