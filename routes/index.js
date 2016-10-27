var express = require('express');
var passport = require('passport');
var User = require('../models/user');
var router = express.Router();





/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', { user : req.user});
});




router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});


module.exports = router;
