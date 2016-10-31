module.exports = function(io,passportSocketIo) {
    var express = require('express');
    var router = express.Router();
    /* GET home page. */

    // socket.io events
    io.on("connection", function(socket) {
        //En socket.request.user esta el usuario conectado al socket
        console.log("Connected ", socket.request.user, socket.request.user.logged_in)
            //Handle events from the user with the socket
            //console.log( "A user connected" );
    });

    //Esta funcion filtra los sockets por alguna propiedad del usuario
    /*passportSocketIo.filterSocketsByUser(io, function(user){
      return user.username === 'wasi';
    }).forEach(function(socket){
      console.log("Hola", socket.request.user.username);
    });*/

    router.get('/', function(req, res) {

        res.render('index', {
            user: req.user
        });
    });



    router.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    return router;
};
