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
        new Card(1, 'copa'),
        new Card(7, 'oro'),
        new Card(2, 'oro')
    ]);

    game.player2.setCards([
        new Card(6, 'copa'),
        new Card(7, 'copa'),
        new Card(2, 'basto')
    ]);
  });

  it('plays [envido, quiero] should gives 2 points to winner', function(){
    game.play('player1', 'envido');
    game.play('player2', 'quiero');

    expect(game.score).to.deep.equal([0, 2]);
  });

  it('plays [envido, no_quiero] should give 1 point to whoever chanted', function(){
  	game.play('player1', 'envido');
	game.play('player2', 'no_quiero');

	expect(game.score).to.deep.equal([1,0]);
   }); 
});
