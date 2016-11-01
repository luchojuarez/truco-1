// Load the module dependecies
var   config = require('./config'),
      mongoose = require('mongoose');


// Define the Mongoose configuration method
module.exports = function(){
  // Use mongoose to connect to MongoDB
  var db = mongoose.connect(config.db);


  // Load the application models
  require('../app/models/user.server.model');
  require('../app/models/newgame.server.model');


  // Return the mongoose connection instance
  return db;
};
