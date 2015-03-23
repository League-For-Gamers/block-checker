'use strict';

module.exports = function(sequelize, DataTypes) {
  var BlockBotBlock = sequelize.define('BlockBotBlock', {
    screenName: { 
      type: DataTypes.STRING,
      primaryKey: true
    },
    level: DataTypes.INTEGER,
    active: DataTypes.BOOLEAN
  }, {
    tableName: 'block_bot_blocks'
  });

  return BlockBotBlock;
}