module.exports = function(io,passportSocketIo) {
    var express = require('express');
    var router = express.Router();
    /* GET home page. */
    var onlinePlayers=[];

    // socket.io events
    io.on("connection", function(socket) {
        console.log("Connected ", socket.request.user, socket.request.user.logged_in)
        if(onlinePlayers.indexOf(socket.request.user.username)<0){
            onlinePlayers.push(socket.request.user.username);
        }
        io.emit("update player logged",{onlinePlayers:onlinePlayers});
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
        var index = onlinePlayers.indexOf(req.user.username);
        if (index > -1) onlinePlayers.splice(index, 1);
        io.emit("update player logged",{onlinePlayers:onlinePlayers});

        req.logout();
        res.redirect('/');
    });

    return router;
};
