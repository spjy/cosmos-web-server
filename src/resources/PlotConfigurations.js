const router = require('express').Router();

const mongoose = require('mongoose');
const models = require('../models');

router.get(
  '/plot_configurations',
  async (req, res, next) => {
    try {

      var query = await models.PlotConfigurations.find({}, function(err, docs){
        if(!err){
          res.json({result: docs} );
        }else {throw err;}

      });

    } catch (error) {
      next(error);
    }

    return next();
  }
);

module.exports = router;
