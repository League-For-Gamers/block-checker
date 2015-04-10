var request = require('request');
var split = require('split');
var config = require('config');
var async = require('async');

var log = require('../lib/logger');
var redis = require('../lib/redis');

var twitterAPI = require('node-twitter-api');
var twitter = new twitterAPI({
  consumerKey: config.get('twitter.consumerKey'),
  consumerSecret: config.get('twitter.consumerSecret')
});

var models = require('../models');
var BlockBotBlock = models.BlockBotBlock;
var GGAutoBlockBlock = models.GGAutoBlockBlock;

module.exports = {
  updateBlockBotBlocks: function updateBlockBotBlocks() {
    function finish(err) {
      if (err) {
        return log.error(err, 'Error updating BlockBot blocks');
      }

      log.info('Finished updating BlockBot blocks');
    }
    // update BlockBot blocks
    log.info('Updating BlockBot blocks');
    request(config.get('blockbotUrl'), function(err, res, body) {
      if (err) {
        return finish(err);
      }

      var rows = body.match(/[^,]+,[^,]+/g);

      var newData = {};

      rows.forEach(function(row) {
        var entry = row.split(',');
        var user = entry[0];
        var level = entry[1];

        if (newData[user]) {
          if (newData[user].level > level) {
            newData[user].level = level;
          }
        }
        else {
          newData[user] = { screenName: user, level: level, active: true };
        }
      });

      var newDataArray = [];

      for (var key in newData) {
        newDataArray.push(newData[key]);
      }

      models.sequelize.transaction(function(t) {
        return BlockBotBlock.update( { active: false }, { where: {}, transaction: t }).then(function(rows) {
          return BlockBotBlock.bulkCreate(newDataArray, { updateOnDuplicate: true, transaction: t });
        })
      }).then(function(result)  {
        return finish();
      }).catch(function(err) {
        return finish(err);
      });
    });
  },

  updateGGAutoBlockBlocks: function updateGGAutoBlockBlocks() {
    function finish(err) {
      if (err) {
        log.error(err, 'Error updating GGAutoBlock blocks');
      }

      return setTimeout(updateGGAutoBlockBlocks, 1000 * config.get('GGAutoBlockUpdateIntervalSeconds'));
    }

    // update GGAutoBlockBlock blocks
    log.info('Updating ggautoblock blocks.');
    redis.get('ggautoblock_cursor', function(err, cursor) {
      if (err) {
        return finish(err);
      }

      if (cursor === null || cursor === '0') {
        log.info('Beginning new ggautoblock sweep');
        cursor = -1;
        redis.del('ggautoblocks');
      }
      else {
        redis.llen('ggautoblocks', function(err, length) {
          log.info('Fetching ggautoblock batch ' + (length+1));
        });
      }

      twitter.blocks('list', {cursor: cursor, skip_status: true, include_entities: false}, config.get('twitter.accessToken'), config.get('twitter.accessTokenSecret'), function(err, data, results) {
        if (err || !data.users.length) {
          return finish(err);
        }

        var rows = [];
        data.users.forEach(function(user) {
          rows.push({userId: user.id, screenName: user.screen_name, active: true});
        });

        redis.rpush('ggautoblocks', JSON.stringify(rows));
        redis.set('ggautoblock_cursor', data.next_cursor);

        if (data.next_cursor) {
          return finish();
        }
        else {
          redis.lrange('ggautoblocks', 0, -1, function(err, list) {
            if (err) {
              return finish(err);
            }

            var newData = [];
            list.forEach(function(section) {
              newData = newData.concat(JSON.parse(section));
            });

            models.sequelize.transaction(function(t) {
              return GGAutoBlockBlock.update( { active: false }, { where: {}, transaction: t }).then(function(rows) {
                return GGAutoBlockBlock.bulkCreate(newData, { updateOnDuplicate: true, transaction: t });
              })
            }).then(function(result)  {
              log.info('ggautoblock sweep complete');
              return finish()
            }).catch(function(err) {
              return finish(err);
            });
          });
        };
      });
    });
  }
};
