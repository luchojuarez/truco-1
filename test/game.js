var utils = require('./utils');
var mongoose = require('mongoose');
var expect = require("chai").expect;
var playerModel = require("../app/game/models/player");
var gameModel   = require("../app/game/models/game");
var roundModel  = require("../app/game/models/round");
var gameCard    = require("../app/game/models/card");

var Round = roundModel.round;
var Game = gameModel.game;
var Card = gameCard.card;
var Player = playerModel.player;

describe('Game', function(){

  beforeEach(function(){
    game = new Game({name : "nuevoJuego", score : [0,0] });
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


  it('Should have two players', function(){
    expect(game).to.have.property('player1');
    expect(game).to.have.property('player2');
  });

describe('Game#recreate', function() {
  it('Recreates cards from a parsed hand of cards', function() {
    game.player1.cards = JSON.parse(JSON.stringify(game.player1.cards));
    game.recreate();
    var recreatedCard = game.player1.cards[0];
    expect(recreatedCard).to.have.property('isBlackCard');
    expect(recreatedCard).to.have.property('envido');
  });

  it('Recreates cards from a parsed board', function() {
    parsedBoard =  [[{ number: 5, suit: 'espada', weight: 2 } ], [ { number: 4, suit: 'basto', weight: 1 }]];
    game.currentRound.board = parsedBoard;
    game.recreate();
    p1Board = game.currentRound.board[0];
    expect(p1Board[0]).to.have.property('envido');
    expect(p1Board[0]).to.have.property('isBlackCard');
  })
});

describe('Game#play', function(){


  it('plays [envido, quiero] should gives 2 points to winner', function(){
    game.play('player1', 'envido');
    game.play('player2', 'quiero');

    expect(game.score[1]).to.equal(2);
  });

  it('plays [envido, no_quiero] should give 1 points to who ever chanted envido', function() {
    game.play('player1', 'envido');
    game.play('player2', 'no_quiero');
    expect(game.score[0]).to.equal(1);
  })

  it('plays [envido, envido, quiero] should gives 4 points to winner', function(){
    game.play('player1', 'envido');
    game.play('player2', 'envido');
    game.play('player1', 'quiero');

    expect(game.score[1]).to.equal(4);
  });

  it('plays [envido, envido, noquiero] should gives 2 points to winner', function(){
    game.play('player1', 'envido');
    game.play('player2', 'envido');
    game.play('player1', 'no_quiero');

    expect(game.score[1]).to.equal(2);
  });

 it('plays [faltaenvido,quiero] should give 30 points to the winner', function() {
    game.play('player1', 'faltaenvido');
    game.play('player2', 'quiero');
    expect(game.score[1]).to.equal(30);
  });

  it('plays [envido,faltaenvido,quiero] should give 30 points to the winner', function() {
    game.play('player1', 'envido');
    game.play('player2', 'faltaenvido');
    game.play('player1', 'quiero');
    expect(game.score[1]).to.equal(30);
  });

it('plays [envido,faltaenvido,no_quiero] should give 2 points to who ever chanted falta', function() {
    game.play('player1', 'envido');
    game.play('player2', 'faltaenvido');
    game.play('player1', 'no_quiero');
    expect(game.score[1]).to.equal(2);
  });


  it('plays [envido,realenvido,quiero] should give 5 points to the winner', function() {
    game.play('player1', 'envido');
    game.play('player2', 'realenvido');
    game.play('player1', 'quiero');
    expect(game.score[1]).to.equal(5);
  });


  it('playing a card removes it from the player hand',function () {
    var cardscount = game.player1.cards.length;
    var cardRemoved = game.player1.cards[1];
    game.play('player1','playCard',cardRemoved);
    game.play('player2','playCard',game.player2.cards[2]);
    game.play('player1','playCard',game.player1.cards[0]);
    expect(game.player1.cards.length).to.be.eq(cardscount-2);
    expect(game.player2.cards.length).to.be.eq(2);
    expect(game.player1.cards).to.not.include(cardRemoved);
  });

    it('plays [truco, quiero] should gives 2 points to winner', function(){
      game.play('player1', 'playCard',game.player1.cards[0]); //juega 1 espada
      game.play('player2', 'truco');
      game.play('player1', 'quiero');
      game.play('player2', 'playCard',game.player2.cards[1]); //juega 7 basto
      game.play('player1', 'playCard',game.player1.cards[0]); //juega 3 oro
      game.play('player2', 'playCard',game.player2.cards[1]); //juega 2 basto
      expect(game.score[0]).to.equal(2);
    });
  // here is TRUCO - NO QUIERO tested
  it('plays some cards then player2 chants truco and player 1 declines it, increase 1 in the score of player 2 ', function() {
    var cardsp1 = game.player1.cards;
	  var cardsp2 = game.player2.cards;
	  var oldscore = game.score[1];
	  game.play('player1', 'playCard', cardsp1[0]); //1 espada
	  game.play('player2','playCard', cardsp2[1]); //7 basto
	  game.play('player1','playCard', cardsp1[0]); //3 oro
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
	game.play('player1','playCard', cardsp1[0]);
	game.play('player2','truco');
	game.play('player1','quiero');
	game.play('player2','playCard', cardsp2[0]);
	game.play('player1','playCard', cardsp1[0]);
	game.play('player2','playCard', cardsp2[0]);
	expect(game.score[0]).to.be.equal(2);
    });
});

});
