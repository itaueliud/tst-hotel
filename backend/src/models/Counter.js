const { Schema, model } = require('mongoose');
const { baseSchemaOptions } = require('./base');

const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
}, baseSchemaOptions);

module.exports = model('Counter', counterSchema);