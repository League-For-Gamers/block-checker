"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable('block_bot_blocks', {
      screenName: {
        type: DataTypes.STRING,
        primaryKey: true
      },
      level: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        type: DataTypes.DATE
      },
      updatedAt: {
        type: DataTypes.DATE
      }
    });

    migration.createTable('ggautoblock_blocks', {
      userId: {
        type: DataTypes.BIGINT,
        primaryKey: true
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        type: DataTypes.DATE
      },
      updatedAt: {
        type: DataTypes.DATE
      }
    });

    done();
  },

  down: function(migration, DataTypes, done) {
    migration.dropTable('block_bot_blocks');
    migration.dropTable('ggautoblock_blocks');
    done();
  }
};
