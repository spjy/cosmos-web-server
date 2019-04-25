const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  satellite: {
    type: String,
    required: true,
  },
  x: {
    type: Number,
    required: true,
  },
  y: {
    type: Number,
    required: true,
  },
  z: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

schema.pre('save', async (next) => {
  next();
});

module.exports = mongoose.model('Orbit', schema);
