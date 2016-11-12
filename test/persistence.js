var utils = require('./utils');
var mongoose = require('mongoose');
var expect = require("chai").expect;
var playerModel = require("../models/player");
var gameModel   = require("../models/game");
var roundModel  = require("../models/round");
var gameCard    = require("../models/card");

var Round = roundModel.round;
var Game = gameModel.game;
var Card = gameCard.card;
var Player = playerModel.player;



describe('Persistence in the database', function(){



//BFeach
  beforeEach(function(){
    game = new Game({name : "nuevoJuego",score : [0,0] });
    player1 = new Player({ nickname: 'J' });
    player2 = new Player({ nickname: 'X' });
    game.setup({ player1 : player1, player2 : player2});
    game.start();

    // Force to have the following cards and envidoPoints
    game.player1.setCards([
        new Card(1, 'espada'),
        new Card(3, 'oro'),
        new Card(7, 'espada')
    ]);

    game.player2.setCards([
        new Card(7, 'oro'),
        new Card(7, 'basto'),
        new Card(2, 'basto')
    ]);


  });

//Begin
  describe('Saving and loading data',function () {

   it('should save a game', function(done) {

    //Do some moves
    game.play('player1', 'playCard',game.player1.cards[0]); //juega 1 espada
    game.play('player2', 'truco');
    game.play('player1', 'quiero');
    game.play('player2', 'playCard',game.player2.cards[1]); //juega 7 basto
    game.play('player1', 'playCard',game.player1.cards[0]); //juega 3 oro
    game.play('player2', 'playCard',game.player2.cards[1]); //juega 2 basto
    game.play('player2','envido');
    game.play('player1','quiero');
    game.play('player2','playCard',game.player2.cards[0]);

    //Keep the old card count in the board
    var pretestCardsCount = game.currentRound.board[0].length + game.currentRound.board[1].length
    //just another move
    game.play('player1', 'playCard',game.player1.cards[0]);
        player1 = game.player1;
        player2 = game.player2;
		game.save(function (err,thegame) {
        	if (err)
				done(err);

            var preSaveBoard = game.currentRound.board;
            var preCardsCount = preSaveBoard[0].length+preSaveBoard[1].length;
            var savedBoard = thegame.currentRound.board;
            var savedCardsCount = savedBoard[0].length+savedBoard[1].length;


			expect(preCardsCount).to.be.eq(savedCardsCount);
            expect(savedCardsCount).to.not.be.eq(pretestCardsCount);
			expect(game.currentRound.fsm).to.be.eq(thegame.currentRound.fsm);
			expect(game.name).to.be.eq(thegame.name);
			done();
		});
	});


  it('Load a saved game', function(done) {
    var gameId;

    //Do some moves
    game.play('player1', 'playCard',game.player1.cards[0]); //juega 1 espada
    game.play('player2', 'truco');
    game.play('player1', 'quiero');
    game.play('player2', 'playCard',game.player2.cards[1]); //juega 7 basto
    game.play('player1', 'playCard',game.player1.cards[0]); //juega 3 oro
    game.play('player2', 'playCard',game.player2.cards[1]); //juega 2 basto
    game.play('player2','envido');
    game.play('player1','quiero');
    game.play('player2','playCard',game.player2.cards[0]);

    game.save(function (err,savedgame) {
        if (err) {
            done(err);
        }
        var savedScore = savedgame.score;
        var savedBoardLength = savedgame.currentRound.board[0].length + savedgame.currentRound.board[1].length;
        gameId = savedgame._id;
        Game.load(gameId,function (err,loaded) {
            if (err) done(err);
            var loadedBoardLength = loaded.currentRound.board[0].length + loaded.currentRound.board[1].length;
            console.log("cartas player 1",loaded.player1.cards);
            console.log("cartas player 2",loaded.player2.cards);
            console.log(loaded.currentRound.board);
            expect(savedBoardLength).to.be.eq(loadedBoardLength);
            expect(savedScore[0]).to.be.eq(loaded.score[0]);
            expect(savedScore[1]).to.be.eq(loaded.score[1]);
            done()
        });
    });
  });

  it('Loading a game does not lose the play method', function(done) {
    var gameId;

    game.play('player1', 'playCard',game.player1.cards[0]); //1 Espada
    game.save(function(err,savedgame) {
        if (err) {
            done(err);
        }
        gameId = savedgame._id;
        Game.load(gameId,function (err,loaded) {
            if (err) done(err);
            loaded.play('player2', 'playCard', game.player2.cards[1]); //7 Basto
            expect(loaded.currentRound.board[1].length).to.be.eq(1);
            done();
        })
    })
  })

    it('Loading a game does not lose the truco and quiero plays', function(done) {
    var gameId;

    game.play('player1', 'playCard',game.player1.cards[0]); //1 Espada
    game.save(function(err,savedgame) {
        if (err) {
            done(err);
        }
        gameId = savedgame._id;
        Game.load(gameId,function (err,loaded) {
            if (err) done(err);
            loaded.play('player2', 'truco');
            expect(loaded.currentRound.currentTurn).to.be.eq('player1');
            expect(loaded.currentRound.currentState).to.be.eq('truco');
            loaded.play('player1', 'quiero');
            expect(loaded.currentRound.currentTurn).to.be.eq('player2');
            expect(loaded.currentRound.currentState).to.be.eq('playingTruco');
            done();
        })
    })
  })


    it('Loading a game does not lose the envido and no quiero plays', function(done) {
    var gameId;

    game.play('player1', 'playCard',game.player1.cards[0]); //1 Espada
    game.save(function(err,savedgame) {
        if (err) {
            done(err);
        }
        gameId = savedgame._id;
        Game.load(gameId,function (err,loaded) {
            if (err) done(err);
            loaded.play('player2', 'envido');
            expect(loaded.currentRound.currentTurn).to.be.eq('player1');
            expect(loaded.currentRound.currentState).to.be.eq('envido');
            loaded.play('player1', 'no_quiero');
            expect(loaded.currentRound.currentTurn).to.be.eq('player2');
            expect(loaded.currentRound.currentState).to.be.eq('playingCard');
            done();
        })
    })
  })
});

});
