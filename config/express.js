// Load the module dependencies
var config = require('./config'),
		http = require('http'),
		socketio = require('socket.io');
	  express = require('express'),
	  morgan = require('morgan'),
	  compress = require('compression'),
	  bodyParser = require('body-parser'),
	  methodOverride = require('method-override'),
	  session = require('express-session'),
		MongoStore = require('connect-mongo')(session),
  	flash = require('connect-flash'),
    passport = require('passport');


// Define the Express configuration method
module.exports = function(){
  //  Create a new Express application instance
	var app = express();

	// Create a new HTTP server
	var server = http.createServer(app);

	// Create a new Socket.io server
	var io = socketio.listen(server); // ESTO ES LO QUE PREGUNTO



// Use the 'NODE_ENV' variable to activate the 'morgan' logger or 'compress' middleware
  if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }
  else if ( process.env.NODE_ENV === 'production') {
    app.use(compress());
  }

  //  Use the 'body-parser' and 'method-override' middleware functions
  app.use(bodyParser.urlencoded({
            extended: true
  }));
  app.use(bodyParser.json());
  app.use(methodOverride());

	// Configure the MongoDB session storage
var mongoStore = new MongoStore({
			db: db.connection.db
	});


	// Configure the 'session' middleware
	app.use(session({
		saveUninitialized: true,
		resave: true,
		secret: config.sessionSecret,
		store: mongoStore
	}));

  //  Set the application view engine and 'views' folder
  app.set('views', './app/views');
	app.set('view engine', 'ejs');


  //  Configure the flash messages middleware
   app.use(flash());

  //  Configure the passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  //  Load the routing files
  require('../app/routes/index.server.routes.js')(app);
  require('../app/routes/users.server.routes.js')(app);
	require('../app/routes/newgame.server.routes.js')(app);

  //  Configure static file serving
  app.use(express.static('./public'));

  //  Return the Express application instance
  return app;
}




/*
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var LocalStrategy = require('passport-local').Strategy;
var socket_io    = require( "socket.io");

// Express
var app = express();

//Socket io
var io  = socket_io();
app.io           = io;

// socket.io events
io.on( "connection", function( socket )
{
  //Handle events from the user with the socket
    //console.log( "A user connected" );
});

//Routes
var index = require('./app/routes/index') (io);
    login = require('./app/routes/login') (io);
    register = require('./app/routes/register');
    users = require('./app/routes/users');
    play = require('./app/routes/play') (io);
    lobby = require('./app/routes/lobby') (io);

    //  Set the application view engine and 'views' folder
app.set('views', path.join(__dirname, './app/views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

// add routers
app.use('/', index);
app.use('/login',login);
app.use('/register',register);
app.use('/lobby',lobby);
app.use('/play',play);


// passport config
var User = require('./app/game/models/user');
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser())

// mongoose
mongoose.connect('mongodb://localhost/truco-development');


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
*/
