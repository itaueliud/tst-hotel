const { Schema, model } = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { baseSchemaOptions } = require('./base');

const userSchema = new Schema({
  _id: { type: String, default: uuidv4 },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff', 'manager'], default: 'staff' }
}, baseSchemaOptions);

module.exports = model('User', userSchema);