var utils = require('./utils');
var expect = require("chai").expect;
var playerModel = require("../models/player");
var gameModel   = require("../models/game");
var gameCard    = require("../models/card");

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

describe('Game#play', function(){
  var game;

  beforeEach(function(){
    game = new Game({ currentHand: 'player1' });
    game.player1 = new Player({ nickname: 'J' });
    game.player2 = new Player({ nickname: 'X' });
    game.newRound();

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
    var game = new Game({ currentHand: 'player1' });
    player1 = new Player({ nickname: 'J' });
    player2 = new Player({ nickname: 'X' });

    player1.save(function(err, player1) {
      if(err)
        done(err)
      game.player1 = player1;
      player2.save(function(err, player2) {
        if(err)
          done(err)
       game.player2 = player2;
        game.save(function(err, model){
          if(err)
            done(err)
          expect(model.player1.nickname).to.be.eq('J');
          expect(model.player2.nickname).to.be.eq('X');
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
	var oldscore = game.score;
	game.play('player1', 'playCard', cardsp1[0]); //1 espada
	game.play('player2','playCard', cardsp2[1]); //4 basto
	game.play('player1','playCard', cardsp1[1]); //3 oro
	game.play('player2','playCard', cardsp2[0]); // 7 oro
	game.play('player2','truco');
	expect(game.score[1]).to.be.equal(oldscore+1);
   });
});
