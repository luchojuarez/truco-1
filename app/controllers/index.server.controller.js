// Create a new 'render' controller method
exports.render = function(req, res) {
	// Use the 'response' object to render the 'index' view with a 'title' and a stringified 'user' properties
	res.render('index', {
		title: 'Truco app',
		userFullName: req.user ? req.user.fullName : ''
	});
};
