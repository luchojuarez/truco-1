var expect = require("chai").expect;
var player_model = require("../models/player");
var game_model   = require("../models/game");
var game_card    = require("../models/card");

var Game = game_model.game;
var Card = game_card.card;

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
    game = new Game();
    game.newRound();

    // Force to have the following cards and envidoPoints
    game.player1.setCards([
        new Card(1, 'espada'),
        new Card(7, 'oro'),
        new Card(1, 'oro')
    ]);

    game.player2.setCards([
        new Card(6, 'copa'),
        new Card(1, 'basto'),
        new Card(2, 'basto')
    ]);
  });

  it('plays [envido, quiero] should gives 2 points to winner', function(){
    game.play('player1', 'cantoEnvido');
    game.play('player2', 'envidoQuerido');

    expect(game.score).to.deep.equal([0, 2]);
  });

    it('plays [truco, quiero] should gives 2 points to winner', function(){
      game.play('player1', 'cantoTruco');
      game.play('player2', 'trucoQuerido');
      game.play('player1', 'playCard',game.player1.cards[0]);
      game.play('player2', 'playCard',game.player2.cards[1]);
      game.play('player1', 'playCard',game.player1.cards[1]);
      game.play('player2', 'playCard',game.player2.cards[2]);
      console.log(game.score);
      expect(game.score).to.deep.equal([0, 2]);
    });
});
