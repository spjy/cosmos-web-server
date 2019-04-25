const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  agent_proc: {
    type: String,
    required: true,
  },
  agent_addr: {
    type: String,
    required: true,
  },
  agent_port: {
    type: Number,
    required: true,
  },
  agent_node: {
    type: String,
    required: true,
  },
  agent_utc: {
    type: Number,
    required: true,
  },
  agent_bprd: {
    type: Number,
    required: true,
  },

  structure: {
    type: Array,
    required: true,
  }
});

schema.pre('save', async (next) => {
  next();
});

module.exports = mongoose.model('AgentList', schema, 'agent_list');
