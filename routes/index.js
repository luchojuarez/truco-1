var express = require('express');
var passport = require('passport');
var User = require('../models/user');
var router = express.Router();

var Game = require("../models/game").game;
var Player = require("../models/player").player;
var Round = require("../models/round").round;
var Card = require("../models/card").card;
var guest;
var actualValues = { FSM: null, board: null, player1: null, player2: null , score: null };
//var currentGame;


/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', { user : req.user , guest : guest});
});

router.get('/register', function(req, res) {
    res.render('register', { });
});

router.post('/register', function(req, res) {
    User.register(new User({ username : req.body.username }), req.body.password, function(err, user) {
        if (err) {
            return res.render('register', { user : user });
        }

        passport.authenticate('local')(req, res, function () {
            res.redirect('/');
        });
    });
});

router.get('/loginGuest',function (req,res) {
    res.render('loginGuest')
})

router.post('/loginGuest',function (req,res) {
    guest= new User( {username : req.body.username , password : 'spiderman'});
    var p1 = new Player({user:req.user,nickname:req.user.username});
    var p2 = new Player({user:guest , nickname:guest.username});
    var game = new Game({
        currentHand : 'player1',
        name:p1.nickname+ ' VS '+p2.nickname,
        score : [0,0],
        player1:p1,
        player2:p2,
    });
    game.newRound();
/*    currentGame.currentRound.fsm = game.currentRound.fsm;
    actualValues.board = game.currentRound.board;
    actualValues.player1 = p1;
    actualValues.player2 = p2;
    actualValues.score = game.score;*/
    saveGame(game,function (err,savedgame) {
        if (err){
            console.error(err);
            return res.render('error',err);
        }
        res.redirect('/play?gameID='+savedgame._id);
    })
})

router.get('/login', function(req, res) {
    res.render('login', { user : req.user});
});

router.post('/login', passport.authenticate('local'), function(req, res) {
    res.redirect('/');
});


router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});


router.get('/play',function (req,res) {
    loadGameById(req.query.gameID,function (err,game) {
        if (err)
            console.error(err);
        else {
			game.recreate()
			console.log(game.player1.cards);
			console.log(game.player2.cards);
			console.log(game.currentRound.fsm.current);
			console.log(game.currentRound.board);	
            res.render('play',{
                game:game,
                gameID:game._id,
                user:{u:req.user, p:game.player1},
                guest:{u:guest, p:game.player2},
                currentTurn:game.currentRound.currentTurn,
            })
        }
    })

})

router.post('/play',function (req,res) {
})

router.get('/changePlayer',function (req,res) {

})

router.post('/changePlayer',function (req,res,next) {
	console.log("CARGANDO JUGADA",req.body.jugada);
	console.log("Id del juego:",req.query.gameID);

    loadGameById(req.query.gameID,function (err,game) {
        if (err) {
		}
        else {
			game.recreate();
			console.log("juego recreado");
			console.log(game.currentRound.fsm.can('playCard'));
			console.log(game.player1.cards);
			var carta;
			var jugada;
			if (!(undefined===req.body.playCard))
				carta=req.body.playCard;
			if (!(undefined===req.body.jugada))
				jugada=req.body.jugada;

			if (jugada){
				console.log("Intentando jugar: ",jugada);
				console.log("FSM CURRENT: ",game.currentRound.fsm.current);
				game.play(game.currentRound.currentTurn,jugada);
			}
			if (carta) {
				if (game.currentRound.fsm.can('playCard')) {
					carta=parseCard(carta);
					console.log("Intentando jugar: playCard");
					console.log("FSM CURRENT: ",game.currentRound.fsm.current);
					game.play(game.currentRound.currentTurn,'playCard',carta);
				}else {
					res.render(error,{message:'invalid'})
				}
			}

			saveGame(game, function(err, lastSaved) {
				if (err) {
					console.error(err);
					return res.render('error', err);
				}
				res.render('changePlayer',{
					player:lastSaved.currentRound.currentTurn,
					gameID:req.query.gameID
				});
			});
      }
	});
});



function saveGame(gameObject, cb) {
    gameObject.currentRound.save(function(err, savedround) {
        if (err)
            return cb(err);
        gameObject.save(function(err, savedgame) {
            if (err) {
                return cb(err);
            }
            cb(err, savedgame);
        });

    });
}
function loadGameById(gameId,cb) {
    Game
        .findOne({_id : gameId })
        .populate("currentRound")
        .exec(function (err,tgame) {
            if (err){
                console.error("GAME NOT LOADED: ",err);
                cb(err,undefined);
            }
            cb(err,tgame);
    });
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
            game.currentRound.fsm = currentGame.currentRound.fsm;
            game.currentRound.board = actualValues.board;
            game.player1 = actualValues.player1;
            game.player2 = actualValues.player2;
            game.score = actualValues.score;
            game.currentRound.game = game;
}
module.exports = router;
