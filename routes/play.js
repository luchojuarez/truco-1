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

router.get('/', function(req,res,next) {
    gameId = req.query.game;
    res.send("Yohoo");
})

module.exports = router;