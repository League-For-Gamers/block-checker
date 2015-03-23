var express = require('express');
var router = express.Router();
var config = require('config');
var async = require('async');

var log = require('../lib/logger');

var twitterAPI = require('node-twitter-api');
var twitter = new twitterAPI({
  consumerKey: config.get('twitter.consumerKey'),
  consumerSecret: config.get('twitter.consumerSecret')
});

var models = require('../models');
var BlockBotBlock = models.BlockBotBlock;
var GGAutoBlockBlock = models.GGAutoBlockBlock;

function checkGGAutoBlockBlocks(screenName, callback) {
  twitter.users('show', { screen_name: screenName }, config.get('twitter.accessToken'), config.get('twitter.accessTokenSecret'), function(err, data, results) {
    if (err || !data) {
      return callback(err);
    }

    GGAutoBlockBlock.find({where: {userId: data.id, active: true}}).then(function(block) {
      callback(null, block);
    }).catch(function(err) {
      callback(err);
    });
  });

}

function checkBlockBotBlocks(screenName, callback) {
  BlockBotBlock.find({where: {screenName: screenName, active: true}}).then(function(block) {
    callback(null, block);
  }).catch(function(err) {
    callback(err);
  });
}

router.get('/', function(req, res, next) {
  if (typeof req.query.screenName == 'undefined' || req.query.screenName == '') {
    return res.render('index');
  }

  var screenName = req.query.screenName.trim();

  if (screenName.substring(0,1) == '@') {
    screenName = screenName.substring(1);
  }

  async.parallel([
    function(callback) {
      checkGGAutoBlockBlocks(screenName, callback);
    },
    function(callback) {
      checkBlockBotBlocks(screenName, callback);
    }],
    function(err, results) {
      if (err) {
        log.error(err);
      }

      res.render('index', {
        ggAutoBlockBlockData: results[0],
        blockBotBlockData: results[1],
        screenName: screenName
      });
    }
  );
});

module.exports = router;
