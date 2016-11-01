// Set the 'NODE_ENV' variable
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

// Load the module dependecies
var mongoose = require('./config/mongoose'),
    express = require('./config/express');
   passport = require('./config/passport');


// Create a new Mongoose connection instance
var db = mongoose();


// Create a new Express application instance
var app = express();


// configure the passport middleware
var passport = passport();


//  Use the 'Express' application instance to listen to the '3000' port
app.listen(3000);


// Log the server status to the console
console.log('Server running at http://localhost:3000/');

//console.log(process.env.NODE_ENV);

// Use the module.exports property to expose our Express application instance for external usage
module.exports = app;

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
