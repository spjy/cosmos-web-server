const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  satellite: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  altitude: {
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

module.exports = mongoose.model('Path', schema);
