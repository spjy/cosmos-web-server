const express = require('express');

const router = express.Router();
const api = express.Router();

const resources = require('../resources');

api.use('/', resources);
router.use('/api', api);

module.exports = router;
