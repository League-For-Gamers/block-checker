'use strict';

module.exports = function(sequelize, DataTypes) {
  var GGAutoBlockBlock = sequelize.define('GGAutoBlockBlock', {
    userId: { 
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    active: DataTypes.BOOLEAN,
    screenName: DataTypes.STRING
  }, {
    tableName: 'ggautoblock_blocks'
  });

  return GGAutoBlockBlock;
}