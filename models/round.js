/*
 *
 * Represents a game's round
 *
 * @param gmae [Object]: game where the round belongs
 *
 */

var _ = require('lodash');
var StateMachine = require("../node_modules/javascript-state-machine/state-machine.js");
var deckModel = require("./deck");
var Deck  = deckModel.deck;

function asignarPuntos(jugador,puntos,instanciaRonda) {
    jugador==="player1" ? instanciaRonda.score[0] += puntos : instanciaRonda.score[1] += puntos;
    return instanciaRonda.score;
}

//Puntos que dan el envido/realenvido/faltaenvido
var valueOf = {
	'envido': 2,
	'realenvido': 3,
	'faltaenvido': -1 //Caso especial, necesita ser calculado
	};

function newTrucoFSM(){
  var fsm = StateMachine.create({
  initial: 'init',final: 'finronda',
  events: [

    { name: 'playCard',     from: 'init',                           	to: 'primerCarta' },
    { name: 'envido',       from: ['init', 'primerCarta'],         		to: 'envido' },
    { name: 'truco',        from: ['init', 'playedCard','primerCarta'], to: 'truco'  },
    { name: 'playCard',		from: ['quiero', 'no_quiero',
									'primerCarta', 'playedCard'],  		to: 'playedCard' },
    { name: 'no_quiero', 	from: 'envido',              				to: 'no_quiero' },
	{ name: 'no_quiero', 	from: 'truco',								to: 'finronda' },
	{ name: 'quiero', 		from: ['envido', 'truco'],					to: 'quiero' },
],
  callbacks: {
	 //Despues del evento jugar carta:
	 //		*Agregar la carta al tablero
	 //		*Verificar si el duelo termino (un duelo termina cuando (this.board[0].length + this.board.length[1]) == 2 || 4 || 6)
	 //			>si termino guardar el resultado del duelo (resultado = "player1" || "player" || "pardas")
	 //			 y establecer el proximo turno al jugador que gano el duelo 
      onplayCard: function (event, from, to, carta, instanciaRonda) {     
      if (instanciaRonda.currentTurn==="player1") {
              instanciaRonda.board[0].push(carta);
          }else {
              instanciaRonda.board[1].push(carta);
          }
          var primera=calculaRonda(instanciaRonda.board,0);
          var segunda=calculaRonda(instanciaRonda.board,1);

          if (primera==segunda&&primera!=undefined) {
              asignarPuntos(primera,2,instanciaRonda);
              return primera;
          }

          var tercera=calculaRonda(instanciaRonda.board,2);
      },

	  //TODO:
	  /*Al entrar al estado playedCard:
	  //	*verificar si la ronda termino
	  //		>si termino, asignar los puntos al ganador en game
	  //	
	  //	La ronda termina cuando:
	  //		_Se jugaron las 6 cartas (this.board[0].length + this.board.length[1] == 6)
   	  //		_Primer duelo = empate, Segundo duelo != empate (gana el del resultado del segundo duelo)
   	  //		_Primer duelo != empate, Segundo duelo = empate (gana el del resultado del primer duelo)
	  */

	  onenterplayedCard: function (event, from, to, carta, instanciaRonda) {},

	  // Cuando se entra al estado envido, apilar 2 puntos a la pila que guarda los diferentes cantos de envido (@envidoStack)
      onenterenvido:			function(event, from, to, carta, tround) {tround.pushEnvidoPlay(to);},
															  //Si se canto envido, suma 2 a la pila de puntos
															  
	  onbeforequiero:		    function(event, from, to, carta, tround) {valueOf[from]? tround.sumarPuntosDeEnvidoCon(true) : tround.puntosTruco++},
															  //Si vino de envido le da los puntos al ganador, sino vino de envido suma puntos al truco
															  //TODO: puntosTruco no esta definido
															  
	  onbeforeno_quiero:		function(event, from, to, carta, tround) {valueOf[from]? tround.sumarPuntosDeEnvidoCon(false) : tround.endRound();},
															  //Si vino de envido le da los puntos al contrario del que dijo no quiero
															  //sino vino de envido se termina la ronda
															  //TODO metodo endRound();
   	  }
	});

  return fsm;
}

//dado un tablero y un numero de ronda tetorna el player que gano
function calculaRonda(board, mano) {
    var quienAgano;
    if (board[0][mano]!= undefined && board[1][mano] != undefined) {
        if (this.currentTurn === "player1") {
            board[0][mano].confront(board[1][mano])>1 ? quienAgano="player1" : quienAgano="player2";
        }else {
            board[0][mano].confront(board[1][mano])<1 ? quienAgano="player2" : quienAgano="player1";
        }
    }
    return quienAgano;
}


function Round(game, turn){
  /*Game*/
  this.game = game;

  /* next turn*/
  this.currentTurn = turn;

  /*here is a FSM to perform user's actions*/
  this.fsm = newTrucoFSM();

  this.status = 'running';

  /* Round' score*/
  this.score = [0, 0];

  /* Puntos acumulados del envido hasta el momento */
  this.envidoStack = [];

  /*Registro de cartas jugadas, board[0]: cartas del jugador 1, board[1]: cartas del jugador2 */
  this.board= [[],[]];
}

Round.prototype.sumarPuntosDeEnvidoCon = function (quiero) {
	if (quiero == true) {
		var puntosConQuiero = this.calculateEnvidoScore(quiero);
		var comparePoints = this.game.player1.envidoPoints - this.game.player2.envidoPoints;
		switch (true) {
			case (comparePoints > 0): //Gano player1 
				this.game.score[0]+= puntosConQuiero; break;
			case (comparePoints < 0): //Gano player2
				this.game.score[1]+= puntosConQuiero; break;
			case (comparePoints = 0)://Empate, puntos van para la mano
				this.game.currentHand === "player1"? this.game.score[0] += puntosConQuiero : this.game.score[1] += puntosConQuiero;
				break;
			};
		}
	else { //quiero == false
		var puntosNoQuiero = this.calculateEnvidoScore(quiero);
		//Si el que dijo no quiero es el jugador 1 se le dan los puntos al jugador 2
		this.currentTurn === "player1"? this.game.score[1] += puntosNoQuiero : this.game.score[0] += puntosNoQuiero;
	}
}		
/* ************************************************************************************************** */
/* De acuerdo a lo que se canto, suma puntos a la pila de envido/realenvido/faltaenvido */
Round.prototype.pushEnvidoPlay = function (tipodejugada) {
	if (valueOf[tipodejugada]<0) { //Se canto falta envido
		var puntosQueFaltan = this.game.maxScore - _.max(this.game.score) - _.sum(this.envidoStack);
		this.envidoStack.push(puntosQueFaltan);
	}
	else {
		this.envidoStack.push(valueOf[tipodejugada]);
	}
}

/***************************************************************************************************** 
 * calculateEnvidoScore utiliza el stack de las jugadas de envido cantadas para calcular los puntos
 * las diferentes variantes son: 
 *		envido+envido [2,2]
 *		envido+envido+faltaenvido[2,2,*]
 *		envido+envido+realenvido [2,2,3]
 *		envido+envido+realenvido+faltaenvido [2,2,3,*]
 *		envido+realenvido [2,3]
 *		envido+realenvido+faltaenvido [2,3,*]
 *		realenvido [3]
 *		realenvido+faltaenvido [3,*]
 *		envido [2]
 *		envido+faltaenvido [2,*]
 *		faltaenvido[*]
 * Donde * = MaxPuntajeParaGanar _ puntos del que va ganando _ puntos acumulados en envidoStack
 * cuando un jugador quiere el envido/realenvido/faltaenvido se hace la sumatoria del arreglo
 * cuando un jugador no quiere el envido/realenvido/faltaenvido
   se saca el tope y se hace la sumatoria de la pila
   |___CASO ESPECIAL: Si al sacar el tope la pila queda vacia entonces se retorna 1 punto
*/
Round.prototype.calculateEnvidoScore = function (quiso) {
	var puntosAcumuladosEnvido = _.sum(this.envidoStack);

		if (quiso) {
			return puntosAcumuladosEnvido;
		}
		else { //no quiso
			var puntosNegados = this.envidoStack.pop();
			if (this.envidoStack.length >0) {
				return puntosAcumuladosEnvido - puntosNegados ;
			}
			else {
				return 1;
			}
		}
	}


/******************************************************************************************************/


/*
 * Generate a new deck mixed and gives to players the correspondent cards
 */
Round.prototype.deal = function(){
  var deck = new Deck().mix();

  this.game.player1.setCards(_.pullAt(deck, 0, 2, 4));
  this.game.player2.setCards(_.pullAt(deck, 1, 3, 5));
};

/*
 * Calculates who is the next player to play.
 *
 * + if action is 'quiero' or 'no_quiero' and it's playing 'envido' the next
 * player to play is who start to chant
 *
 * + if action is 'quiero' or 'no_quiero' and it's playing 'envido' the next
 * player to play is who start to chant
 *
 * ToDo
 */
Round.prototype.changeTurn = function(){
   return this.currentTurn = switchPlayer(this.currentTurn);
}

/*
 * returns the oposite player
 */
function switchPlayer(player) {
  return "player1" === player ? "player2" : "player1";
};

/*
 * ToDo: Calculate the real score
 */
Round.prototype.calculateScore = function(action){
  if(action == "quiero" || action == "no_quiero"){
    //this.score = [0, 2];
    this.game.score[0] += this.score[0];
    this.game.score[1] += this.score[1];
  }

  return this.score;
}

/*
 * Let's Play :)
 */
Round.prototype.play = function(action, value) {
  // move to the next state
  //this.board[0].push(value);
  this.fsm[action](value,this);


  // Change player's turn
  return this.changeTurn();
};

module.exports.round = Round;
