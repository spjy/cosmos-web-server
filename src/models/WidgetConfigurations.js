const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  created: {
    type: Date,
    required: true,
  },
  edited: {
    type: Date,
    required: true,
  },

  widgets: {
    type: Array,
    required: true,
  }
});

schema.pre('save', async (next) => {
  next();
});

module.exports = mongoose.model('WidgetConfigurations', schema, 'widget_configurations');
