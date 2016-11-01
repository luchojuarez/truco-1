// Define the routes module' method
module.exports = function(app) {
	// Load the 'index' controller
	var index = require('../controllers/newgame.server.controller');

	// Mount the 'index' controller's 'render' method
	app.get('/', newgame.render);
};
