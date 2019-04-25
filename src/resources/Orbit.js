const router = require('express').Router();

const models = require('../models');

router.get(
  '/replay/orbit/:satellite/:dateFrom/to/:dateTo/',
  async (req, res, next) => {
    try {
      const { satellite, dateFrom, dateTo } = req.params;

      const orbit = await models.Orbit
        .find({
          createdAt: {
            $gte: dateFrom,
            $lt: dateTo,
          },
        })
        .sort({ createdAt: -1 });

      res.json(orbit || {});
    } catch (error) {
      next(error);
    }

    return next();
  },
);

module.exports = router;
