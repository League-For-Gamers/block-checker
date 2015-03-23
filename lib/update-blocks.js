var request = require('request');
var split = require('split');
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

function getGGAutoBlockBlocks(callback, cursor) {
  if (typeof cursor == 'undefined') {
    cursor = -1;
  }

  twitter.blocks('ids', {cursor: cursor}, config.get('twitter.accessToken'), config.get('twitter.accessTokenSecret'), function(err, data, results) {
    if (err || !data.ids.length) {
      return callback(err);
    }

    var rows = [];
    data.ids.forEach(function(id) {
      rows.push({userId: id, active: true});
    });

    GGAutoBlockBlock.bulkCreate(rows, { updateOnDuplicate: true }).then(function() {
      if (data.next_cursor) {
        return getGGAutoBlockBlocks(callback, data.next_cursor);
      }
      else {
        return callback();
      }
    });
  });
}

module.exports = function updateBlocks() {
  // update GGAutoBlockBlock blocks
  log.info('Updating ggautoblock blocks.');
  GGAutoBlockBlock.update( { active: false }, { where: {} }).then(function(rows) {
    getGGAutoBlockBlocks(function(err) {
      if (err) {
        return log.error(err, 'Error updating ggautoblock blocks');
      }

      log.info('Finished updating ggautoblock blocks.');
    });
  });

  // update BlockBot blocks
  log.info('Updating BlockBot blocks');
  BlockBotBlock.update( { active: false }, { where: {} }).then (function(rows) {
    request(config.get('blockbotUrl'), function(err, res, body) {
      if (err) {
        return log.error(err, 'Error updating BlockBot blocks');
      }

      var rows = body.match(/[^,]+,[^,]+/g);

      async.eachSeries(rows, function(row, callback) {
        var entry = row.split(',');
        var user = entry[0];
        var level = entry[1];

        BlockBotBlock.find(user).then(function(block) {
          if (block) {
            if (!block.active || block.level > level) {
              block.level = level;
              block.active = true;
              return block.save().then(function() { return callback() });
            } else {
              return callback();
            }
          }
          else {
            BlockBotBlock.create({screenName: user, level: level}).then(function() { return callback() });
          }
        });
      }, function(err) {
        if (err) {
          return log.error(err, 'Error updating BlockBot blocks');
        }
        
        return log.info('Finished updating BlockBot blocks');
      });
    });
  });
}