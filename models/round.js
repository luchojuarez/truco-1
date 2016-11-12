
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
var Deck = deckModel.deck;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Card = require("./card").card;



var RoundSchema = new Schema({

  /*Game*/
  game: Object,

  /* next turn*/
  currentTurn:  String,

  /*here is a FSM to perform user's actions*/
  fsm: { type: Object , default : newTrucoFSM() },

  status: { type: String, default : 'running' },

  /* Round' score*/
  score: { type: Array , default : [0, 0] },

  /*Puntos que se estan jugando del truco/retruco/vale4*/
  puntosTruco: { type: Number, default : 1 },

  /* Resultados de cada duelo: empate/player1/player2 */
  resultados: { type: Array , default : [] },

  /* Puntos acumulados del envido hasta el momento */
  envidoStack: { type: Array , default : [] },

  /* Almacena el turno al que se debe cambiar luego de cantar quiero del envido/truco o luego de que termino un duelo */
  nextTurn: { type: String, default: null },

  /* Almacena el evento corriente de la FSM */
  currentState: { type: String, default: 'init' },

  /* Almacena la ultima jugada */
  lastPlay: { type:String, default: null },

  /*Registro de cartas jugadas, board[0]: cartas del jugador 1, board[1]: cartas del jugador2 */
  board: { type: Schema.Types.Mixed , default: [[Card],[Card]]},

});

RoundSchema.pre('save',function(next) {
    this.markModified('fsm');
    this.markModified('board');
    this.markModified('envidoStack');
    this.markModified('resultados');
    this.markModified('score');
    this.markModified('game');
    next();
})

var Round = mongoose.model('Round', RoundSchema);


//Puntos que dan el envido/realenvido/faltaenvido
var valueOf = {
    'envido': 2,
    'envido2' : 2,
    'realenvido': 3,
    'faltaenvido': -1 //Caso especial, necesita ser calculado
};

//Usado para filtrar eventos
var raise = {
    'truco' : true,
    'retruco' : true,
    'valecuatro' : true
};

//Auxiliares, no afectan en nada si son modificadas
var eventoDisparado;
var estadoAlcanzado;



function newTrucoFSM(){
  var fsm = StateMachine.create({
  initial: 'init' , final: 'finronda',
  events: [

    { name: 'playCard',     from: 'init',                           	to: 'primerCarta' },
    { name: 'envido',       from: ['init', 'primerCarta'],         		to: 'envido' },
    { name: 'truco',        from: ['init', 'playingCard','primerCarta'],to: 'truco'  },
    { name: 'playCard',		from: ['primerCarta', 'playingCard'],  		to: 'playingCard' },
    { name: 'playCard',     from: 'playingTruco',                       to: 'playingTruco'},
    { name: 'playCard',     from: 'playingRetruco',                     to: 'playingRetruco'},
    { name: 'playCard',     from: 'playingValecuatro',                  to: 'playingValecuatro'},
    { name: 'no_quiero', 	from: ['envido','envido2','realenvido',
                                   'faltaenvido'],         				to: 'playingCard' },
	{ name: 'no_quiero', 	from: ['truco','retruco','valecuatro'],		to: 'finronda' },
    { name: 'quiero',       from: ['envido','envido2','realenvido',
                                   'faltaenvido'],                      to: 'playingCard' },
    { name: 'quiero',       from: 'truco',                              to: 'playingTruco'},
    { name: 'retruco',      from: ['truco','playingTruco'],             to: 'retruco'},
    { name: 'quiero',       from: 'retruco',                            to: 'playingRetruco'},
    { name: 'valecuatro',   from: ['retruco','playingRetruco'],         to: 'valecuatro'},
    { name: 'quiero',       from: 'valecuatro',                         to: 'playingValecuatro'},
    { name: 'envido',       from: 'envido',                             to: 'envido2'},
    { name: 'realenvido',   from: ['envido2','envido','init',
                                   'primerCarta'],                      to: 'realenvido'},
    { name: 'faltaenvido',  from: ['envido2','envido','init',
                                   'primerCarta','realenvido'],         to: 'faltaenvido'},
],
    callbacks: {
        //Antes de realizar la transcicion de estados cuando juega carta:
        //      *Agregar la carta al tablero
        //      *Sacar la carta de la mano del jugador
        onbeforeplayCard: function(event, from, to, carta, instanciaRonda) {
            instanciaRonda.pushCardToBoard(carta);
            var player = getCurrentPlayer(instanciaRonda);
            var cardIndex;
            for (var i = 0; i < player.cards.length; i++){
                if (carta.number === player.cards[i].number && carta.suit === player.cards[i].suit) {
                    cardIndex = i;
                }
            }
            _.pullAt(player.cards,cardIndex);
        },

        onafterevent: function(event,from,to) {
            eventoDisparado = event;
            estadoAlcanzado = to;
        },

        /*Despues de hacer la transicion:
     //     *Verificar si el duelo termino (un duelo termina cuando (this.board[0].length + this.board.length[1]) == 2 || 4 || 6)
     //         >si termino guardar el resultado del duelo (resultado = "player1" || "player2" || "empate")
     //          y establecer el proximo turno al jugador que gano el duelo
      //        >verificar si la ronda termino
      //            >si termino, asignar los puntos al ganador en game
      //    *Si el duelo no termino, el proximo turno es el del jugador contrario
      */

        onafterplayCard: function(event, from, to, carta, instanciaRonda) {
            if (duelEnd(instanciaRonda.board)) {


                var resultado = instanciaRonda.calcularRonda(instanciaRonda.board);
                instanciaRonda.resultados.push(resultado);
                //Si es empate, el proximo turno es el de la mano del juego
                if (resultado !== "empate") {
                    instanciaRonda.nextTurn = resultado;
                } else {
                    instanciaRonda.nextTurn = instanciaRonda.game.currentHand;
                }

                if (instanciaRonda.hasEnded()) {
                    instanciaRonda.updateRoundScore();
                }
            } else { //Se sigue jugando el duelo, el proximo a jugar es el contrario del currentTurn
                instanciaRonda.nextTurn = switchPlayer(instanciaRonda.currentTurn);
            }
        },

        // Cuando se entra al estado envido:
        //  *apilar 2 puntos a la pila que guarda los diferentes cantos de envido (@envidoStack)
        //  *guardar la persona que canto el envido en this.nextTurn
        onenterenvido: function(event, from, to, carta, tround) {
            tround.pushEnvidoPlay(event);
            tround.nextTurn = tround.currentTurn;
        },

        // Cuando entra al estado envido2
        //  *apilar 2 puntos a la pila que guarda los diferentes cantos de envido (@envidoStack)
        onenterenvido2: function(event, from, to, carta, tround) {
            tround.pushEnvidoPlay(event);
        },

        // Cuando se entra al estado realenvido:
        //  *apilar 3 puntos a la pila que guarda los diferentes cantos de envido (@envidoStack)
        //  *si se canto realenvido sin haberse cantado otro envido antes guardar el turno del que canto
        onenterrealenvido: function(event, from, to, carta, tround) {
            if (valueOf[from] === undefined) {//Si no vino de ningun otro envido se guarda el turno
                tround.nextTurn = tround.currentTurn;
            }
            tround.pushEnvidoPlay(event);
        },

        // Cuando se entra al estado faltaenvido:
        //  *calcula los puntos que daria la falta restando los ya acumulados en(@envidoStack) y los apila
        //  *si se canto faltaenvido sin haberse cantado otro envido antes guardar el turno del que canto
        onenterfaltaenvido: function(event, from, to, carta, tround) {
            if (valueOf[from] === undefined) {//Si no vino de ningun otro envido se guarda el turno
                tround.nextTurn = tround.currentTurn;
            }
            tround.pushEnvidoPlay(event);
        },

		//Cuando se canta truco se guarda el turno del que canto
        onentertruco: function(event, from, to, carta, tround) {
            tround.nextTurn = tround.currentTurn;
        },

        onenterretruco: function(event,from,to,carta,tround) {
            if (from === 'truco') { //Si vino del truco se suma el punto del truco
                tround.puntosTruco++;
            }
            else {  //Si vino de una jugada normal se almacena el turno del que canto
                tround.nextTurn = tround.currentTurn;
            }
        },

        onentervalecuatro: function(event,from,to,carta,tround) {
            if (from === 'retruco') { //Si vino del retruco se suma el punto del truco
                tround.puntosTruco++;
            }
            else {  //Si vino de una jugada normal se almacena el turno del que canto
                tround.nextTurn = tround.currentTurn;
            }
        },

        //Despues del quiero depende de donde vino
        onafterquiero: function(event, from, to, carta, tround) {
            valueOf[from] ? tround.sumarPuntosDeEnvidoCon(true) : tround.puntosTruco++;
        },
        //Si vino de algun envido le da los puntos al ganador, sino vino de envido suma puntos al truco
        //porque vino de un truco/retruco/valecuatro

        onafterno_quiero: function(event, from, to, carta, tround) {
			if (valueOf[from]) {
				tround.sumarPuntosDeEnvidoCon(false);
			}
			else {
                asignarPuntos(tround,switchPlayer(tround.currentTurn),tround.puntosTruco);
				tround.endRound();
			}
        },
        //Si vino de algun envido le da los puntos al contrario del que dijo no quiero
        //Si no vino de envido le da los puntos acumulados del truco hasta el momento al jugador que canto truco
    }
});
  return fsm;
}

Round.prototype.resetValues = function () {
    this.fsm.current = 'init';
    this.board[0] = [];
    this.board[1] = [];
    this.nextTurn = null;
    this.score = [0,0];
    this.puntosTruco = 1;
    this.envidoStack = [];
}




//Funciones

function asignarPuntos(instanciaRonda,player,puntos) {
    player === "player1" ? instanciaRonda.score[0] += puntos : instanciaRonda.score[1] += puntos;
    return instanciaRonda.score;
}

function getCurrentPlayer(instanciaRonda) {
    var player;
    instanciaRonda.currentTurn === 'player1' ? player = instanciaRonda.game.player1 : player = instanciaRonda.game.player2;
    return player;
}

//pre: un tablero con cartas
//post: true si la cantidad de cartas jugadas es 2 o 4 o 6
function duelEnd(board) {

    var totalCartas = board[0].length + board[1].length;
    return (totalCartas == 2 ||
            totalCartas == 4 ||
            totalCartas == 6);
}
/*
 * returns the oposite player
 */
function switchPlayer(player) {
    return "player1" === player ? "player2" : "player1";
}


//Metodos de la ronda

//PRE: Cantidad de cartas del tablero = 2 || 4 || 6
//dado un tablero, ve las ultimas dos cartas jugadas del tablero y retorna el jugador ganador
Round.prototype.calcularRonda = function(board, mano) {
    var quienAgano;
    var cartasJ1 = board[0];
    var cartasJ2 = board[1];
    var ultimaJugadaJ1 = cartasJ1[cartasJ1.length - 1];
    var ultimaJugadaJ2 = cartasJ2[cartasJ2.length - 1];
    var confrontResult = ultimaJugadaJ1.confront(ultimaJugadaJ2);
    switch (true) {
        case (confrontResult > 0):
            {
                quienAgano = "player1";
                break;
            }
        case (confrontResult < 0):
            {
                quienAgano = "player2";
                break;
            }
        case (confrontResult == 0):
            {
                quienAgano = "empate";
                break;
            }
    };
    return quienAgano;
};

/*
    La ronda termina cuando:
        -Se jugaron las 6 cartas (this.board[0].length + this.board.length[1] == 6)
        -Primer duelo = empate, Segundo duelo != empate (gana el del resultado del segundo duelo)
        -Primer duelo != empate, Segundo duelo = empate (gana el del resultado del primer duelo)
        -Pirmer duelo y segundo son iguales (gano 2 veces seguidas)
*/
Round.prototype.hasEnded = function() {
    var cartasJugadas = (this.board[0].length + this.board[1].length);
    switch (true) {
        case (cartasJugadas == 6):
            {
                return true;
                break;
            }
        case (this.resultados[0] === "empate"
              && (this.resultados[1] === "player1" || this.resultados[1] === "player2")) :
            {
                return true;
                break;
            }
        case (this.resultados[0] !== "empate" && this.resultados[1] === "empate"):
            {
                return true;
                break;
            }
        case (this.resultados[0] === this.resultados[1]
              && this.resultados[0] !== 'empate'):
            {
                return true;
                break;
            }
        default:
            return false;
    }
}

/*
 *Mira el ganador de la ronda y actualiza el puntaje al juego
 */
Round.prototype.updateRoundScore = function() {
    //Actualizar el score de la ronda
    var resultCount = {
        "player1": 0,
        "player2": 0,
        "empate": 0
    };
    for (var i = 0; i < this.resultados.length; i++) {
        resultCount[this.resultados[i]]++;
    }

    //Vemos los empates para saber quien gano
    switch (resultCount.empate) {
        case 3:
            { //3 empates, gana la mano
                asignarPuntos(this,this.game.currentHand,this.puntosTruco);
                break;
            }
        case 2:
            { //2 empates, gana el 3er duelo
                asignarPuntos(this,this.resultados[2],this.puntosTruco);
                break;
            }
        case 1:
            { //1 empate, gana el primero que haya ganado algun duelo
                var ganador;
                this.resultados[0] == "empate" ? ganador = this.resultados[1] : ganador = this.resultados[0];

                asignarPuntos(this,ganador,this.puntosTruco);
                break;
            }
        case 0: //Si no hubo empates, gana el que tenga 2 victorias
            {
                resultCount.player1 > resultCount.player2 ? this.score[0] += this.puntosTruco : this.score[1] += this.puntosTruco;
				break;
            }
        default:
    }
    //Actualizar el score del juego
    this.endRound();
};

//Actualiza los puntos de la ronda al juego y le avisa que fueron cambiados
Round.prototype.endRound = function() {
	this.game.score[0] += this.score[0];
    this.game.score[1] += this.score[1];
    this.game.newRound();
};

Round.prototype.pushCardToBoard = function(carta) {
    if (this.currentTurn === "player1") {
        this.board[0].push(carta);
    } else {
        this.board[1].push(carta);
    }
};

Round.prototype.sumarPuntosDeEnvidoCon = function(quiero) {
        if (quiero === true) {
            var puntosConQuiero = this.calculateEnvidoScore(quiero);
            var comparePoints = this.game.player1.envidoPoints - this.game.player2.envidoPoints;
            switch (true) {
                case (comparePoints > 0): //Gano player1
                    this.game.score[0] += puntosConQuiero;
                    break;
                case (comparePoints < 0): //Gano player2
                    this.game.score[1] += puntosConQuiero;
                    break;
                case (comparePoints = 0): //Empate, puntos van para la mano
                    this.game.currentHand === "player1" ? this.game.score[0] += puntosConQuiero : this.game.score[1] += puntosConQuiero;
                    break;
            }
        } else { //quiero == false
            var puntosNoQuiero = this.calculateEnvidoScore(quiero);
            //Si el que dijo no quiero es el jugador 1 se le dan los puntos al jugador 2
            this.currentTurn === "player1" ? this.game.score[1] += puntosNoQuiero : this.game.score[0] += puntosNoQuiero;
        }
    };
    /* ************************************************************************************************** */
    /* De acuerdo a lo que se canto, suma puntos a la pila de envido/realenvido/faltaenvido */
Round.prototype.pushEnvidoPlay = function(tipodejugada) {
    if (valueOf[tipodejugada] < 0) { //Se canto falta envido
        var puntosQueFaltan = this.game.maxScore - _.max(this.game.score) - _.sum(this.envidoStack);
        this.envidoStack.push(puntosQueFaltan);
    } else {
        this.envidoStack.push(valueOf[tipodejugada]);
    }
};

/*****************************************************************************************************
 * calculateEnvidoScore utiliza el stack de las jugadas de envido cantadas para calcular los puntos
 * cuando un jugador quiere el envido/realenvido/faltaenvido se hace la sumatoria del arreglo
 * cuando un jugador no quiere el envido/realenvido/faltaenvido
   se saca el tope y se hace la sumatoria de la pila
   |___CASO ESPECIAL: Si al sacar el tope la pila queda vacia entonces se retorna 1 punto
*/
Round.prototype.calculateEnvidoScore = function(quiso) {
    var puntosAcumuladosEnvido = _.sum(this.envidoStack);

    if (quiso) {
        return puntosAcumuladosEnvido;
    } else { //no quiso
        var puntosNegados = this.envidoStack.pop();
        if (this.envidoStack.length > 0) {
            return puntosAcumuladosEnvido - puntosNegados;
        } else {
            return 1;
        }
    }
};

/******************************************************************************************************/

/*
 * Generate a new deck mixed and gives to players the correspondent cards
 */
Round.prototype.deal = function() {
    var deck = new Deck().mix();

    this.game.player1.setCards(_.pullAt(deck, 0, 2, 4));
    this.game.player2.setCards(_.pullAt(deck, 1, 3, 5));
};

/*
 * Calculates who is the next player to play.
 *
 * + if action is 'quiero' or 'no_quiero' and it's playing 'envido' the next
 * player to play is who start to chant
 * + if action is 'playCard' next to play is the duel winner, the hand of the game if duel is tied, or the other player otherwise
 */
Round.prototype.changeTurn = function(action) {
    if (action === "quiero" ||
        action === "no-quiero" ||
        action === "playCard") {
        return this.currentTurn = this.nextTurn;
    } else {
        return this.currentTurn = switchPlayer(this.currentTurn);
    }

};

Round.prototype.recreate = function() {
    this.fsm = newTrucoFSM();
    this.fsm.current = this.currentState;
}


/*
 * Let's Play :)
 */
Round.prototype.play = function(action, value) {
    // move to the next state
    this.fsm[action](value, this);
    this.currentState = estadoAlcanzado;
    this.lastPlay = eventoDisparado;

    // Change player's turn
    this.changeTurn(action);
};

module.exports.round = Round;
