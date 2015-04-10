"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('ggautoblock_blocks', 'screenName', DataTypes.STRING);
    done();
  },

  down: function(migration, DataTypes, done) {
    migration.removeColumn('ggautoblock_blocks', 'screenName');
    done();
  }
};
