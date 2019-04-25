const router = require('express').Router();

const mongoose = require('mongoose');
const models = require('../models');

router.get(
  '/cosmos_agent/:agent/',
  async (req, res, next) => {
    try {
      const vals = req.params;
      var query = await models.AgentList.find({agent_proc:vals.agent}, function(err, docs){
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
