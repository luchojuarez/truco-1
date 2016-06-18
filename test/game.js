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

describe('Game', function(){
  var game = new Game();

  it('Should have two players', function(){
    expect(game).to.have.property('player1');
    expect(game).to.have.property('player2');
  });
});


describe('Game#save&restore', function(){

  var savedGameId;
  var savedGame;
  var savedRound;
  var savedRoundId;

  beforeEach(function(done){
    game = new Game({name : "nuevoJuego" });
    game.player1 = new Player({ nickname: 'J' });
    game.player2 = new Player({ nickname: 'X' });
    game.newRound({game : game, currentTurn : game.currentHand });

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
    
    cr = game.currentRound;
    cr.save(function(err,savedround) {
      if (err)
        done(err)
      savedRound = savedround;
      savedRoundId = savedround._id;

      game.save(function(err, model) {
            if (err) {
              done(err);
            }
            savedGameId = model._id;
            savedGame = model;
            done();
      });
    });
  });

  it("Saved the id", function() {
      var roundId;
      var Game = gameModel.game;
      var Round = roundModel.round;
      Game.findOne({
        _id: savedGameId
      }, function(err, restored) {
        if (err) {
          console.error(err);
        }
        roundId = restored.currentRound;
      })
      Round.findOne({
        _id: roundId
      }, function(err, round) {
        if (err) {
          console.error(err)
        }
        console.log("The round is saved?", round);
        console.log("Recovered round id: "
          round._id);
      })
      expect(true).to.be.ok;
    })
    //return false;
    /*var Game = GameModel;
    Game.findOne({name : "mijuego" }, function(err,thegame) {
              if(err) {
                          console.log("Server status? =",mongoose.connection.readyState);
                          console.error(err);
              }
              console.log("showing curr round ",thegame.currentRound);
              expect(thegame.name).to.be.eq("mijuego");
          });*/
  });

describe('Game#play', function(){
  var game;

  beforeEach(function(){
    game = new Game({name : "mijuego" });
    game.player1 = new Player({ nickname: 'J' });
    game.player2 = new Player({ nickname: 'X' });
    game.newRound({game : game, currentTurn : game.currentHand });

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

  it('should save a game', function(done){
    player1 = game.player1
    player2 = game.player2
    var theRound = game.currentRound;


    player1.save(function(err, player1) {
      if(err)
        done(err)
      game.player1 = player1;
      player2.save(function(err, player2) {
        if(err) {
          done(err);
        }
       game.player2 = player2;
       game.save(function(err, model){
          if(err)
            done(err)
          expect(model.player1.nickname).to.be.eq('J');
          expect(model.player2.nickname).to.be.eq('X');
          expect(model.currentRound).to.be.eq(theRound);  
          done();
        });
      })
    });
  });

  it('plays [envido, quiero] should gives 2 points to winner', function(){
    game.play('player1', 'envido');
    game.play('player2', 'quiero');

    expect(game.score[1]).to.equal(2);
  });

  it('plays [envido, no_quiero] should give 1 points to who ever chanted envido', function() {
    game.play('player1', 'envido');
    game.play('player2', 'no_quiero');
    expect(game.score[0]).to.equal(1);
  });

    it('plays [truco, quiero] should gives 2 points to winner', function(){
      
      game.play('player1', 'truco');
      game.play('player2', 'quiero');
      game.play('player1', 'playCard',game.player1.cards[0]); //juega 1 espada
      game.play('player2', 'playCard',game.player2.cards[1]); //juega 4 basto
      game.play('player1', 'playCard',game.player1.cards[1]); //juega 3 oro
      game.play('player2', 'playCard',game.player2.cards[2]); //juega 2 basto
      expect(game.score[0]).to.equal(2);
    });
   it('plays some cards then player2 chants truco and player 1 declines it, increase 1 in the score of player 2 ', function() {
	var cardsp1 = game.player1.cards;
	var cardsp2 = game.player2.cards;
	var oldscore = game.score[1];
	game.play('player1', 'playCard', cardsp1[0]); //1 espada
	game.play('player2','playCard', cardsp2[1]); //4 basto
	game.play('player1','playCard', cardsp1[1]); //3 oro
	game.play('player2','playCard', cardsp2[0]); // 7 oro
	game.play('player2','truco');
	game.play('player1','no_quiero');
	expect(game.score[1]).to.be.equal(oldscore+1);
   });

   it('plays a round with all ties, player 1(the hand) wons, also truco is chanted', function() {
    game.player1.setCards([
        new Card(4, 'espada'),
        new Card(5, 'oro'),
        new Card(6, 'espada')
    ]);

    game.player2.setCards([
        new Card(4, 'oro'),
        new Card(5, 'basto'),
        new Card(6, 'basto')
    ]);
 	var cardsp1 = game.player1.cards;
	var cardsp2 = game.player2.cards;
	game.play('player1','playCard', cardsp1[0]);
	game.play('player2','playCard', cardsp2[0]);
	game.play('player1','playCard', cardsp1[1]);
	game.play('player2','truco');
	game.play('player1','quiero');
	game.play('player2','playCard', cardsp2[1]); 
	game.play('player1','playCard', cardsp1[2]); 
	game.play('player2','playCard', cardsp2[2]);
	expect(game.score[0]).to.be.equal(2);
    });
});
