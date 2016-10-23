var express = require('express');
var passport = require('passport');
var User = require('../models/user');
var router = express.Router();

var Game = require("../models/game").game;
var Player = require("../models/player").player;
var Round = require("../models/round").round;
var Card = require("../models/card").card;




/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', { user : req.user});
});




router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});



function getAllPlayers(callback) {
    Player.find()
    .exec(function (err, players) {
        if (err){
            callback(err,undefined);
            console.error(err);
        }
        callback(err,players)
    })
}


function parseCard (carta) {
    var number = parseInt(carta.split("",2)[0]+carta.split("",2)[1]);
	var suit = carta.split("",7);
	if (suit[5]===' ') {
		suit=suit[6];
	}else{
		suit=suit[5]
	}
	switch (suit){
		case 'e':
			suit = 'espada';
			break;
		case 'b':
			suit = 'basto';
			break;
		case 'c':
			suit = 'copa'
			break;
		case 'o':
			suit='oro'
			break;
	}
    return new Card(number,suit);
}

function restoreValues (game) {
            game.currentRound.fsm = actualValues.FSM;
            game.currentRound.board = actualValues.board;
            game.player1 = actualValues.player1;
            game.player2 = actualValues.player2;
            game.score = actualValues.score;
            game.currentRound.game = game;
}
module.exports = router;
