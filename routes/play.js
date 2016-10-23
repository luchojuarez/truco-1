/*TODO:
    + query the game id
    + Load it with Game.load(gameId,callback)
    + Identify the current user with the player in the game
    + Parse the needed data to render the view (current player cards, current turn, board, points, etc)
    + Render the view
*/
var express = require('express');
var passport = require('passport');
var User = require('../models/user');
var router = express.Router();

var Game = require("../models/game").game;
var Player = require("../models/player").player;

function mustBeLogged(req,res,next) {
    if(!req.user) return res.redirect('/login');
    next();
}

router.use(mustBeLogged);

router.get('/', function(req,res,next) {
    gameId = req.query.gameId;
    Game.load(gameId,function (err,game) {
        console.log(req.user._id.toString() === game.player2.user.toString());
        console.log(req.user._id);
        console.log(game.player1.user);
        console.log(game.player2.user);
    })
})

module.exports = router;
