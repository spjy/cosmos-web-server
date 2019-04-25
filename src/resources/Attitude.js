const router = require('express').Router();

const models = require('../models');

router.get(
  '/replay/attitude/:satellite/:dateFrom/to/:dateTo/',
  async (req, res, next) => {
    try {
      const { satellite, dateFrom, dateTo } = req.params;

      const attitude = await models.Attitude
        .find({
          createdAt: {
            $gte: dateFrom,
            $lt: dateTo,
          },
        })
        .sort({ createdAt: -1 });

      res.json(attitude || {});
    } catch (error) {
      next(error);
    }

    return next();
  },
);

module.exports = router;
