var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var colors = ["#424242","#E53935","#8E24AA","#D81B60","#00897B","#FDD835","#039BE5","#E91E63","#2196F3","#3F51B5","#4CAF50","#FFC107","#FF9800","#FFEB3B"];
var backgroundColor = "#424242";

var eraser = undefined;

var peoples = new Array();
var rooms = new Array();

//ExpressJS
app.use(express.static('public'));


app.get('/', function(req, res){
  res.sendFile(__dirname +'/public/views/index.html');
});

app.get('/admin', function(req, res){
  res.sendFile(__dirname +'/public/views/admin.html');
});


//Socket.io
http.listen(3000, function(){
  console.log('listening on *:3000');
});

io.on('connection', function(socket){
    console.log('user connected');

    socket.on("login", function(){
      peoples.push({ "id" : socket.id, "color" : undefined, "isEraser" : false});
      displayNumberOfConnectedUsers();
      io.emit("userList", peoples);
      socket.emit("login");
      io.emit('updateNumberOfConnectedUsers', peoples.length);
    });

    socket.on("adminLogin", function(){
      var infosRooms = new Array();
      rooms.forEach(function(room){
          infosRooms.push({"name" : room.name,"people" : getClientsInARoom(room.name)});
      });

      socket.emit('updateRooms', infosRooms);
    });

    socket.on("joinRoom", function(roomName){
      //Si on était déjà dans une room on la quitte
      if(socket.room != undefined){
        socket.broadcast.to(socket.room).emit('userLeftRoom', '(pseudo) left the room'); //on changera plus tard avec son vrai pseudo
        //s'il était seul dans la room on delete la room
        if(getClientsInARoom(socket.room).length - 1 == 0)
          rooms.splice(arrayObjectIndexOf(rooms, socket.room, "name"), 1);
        socket.leave(socket.room);
      }

      var myRoom = rooms.find(room => room.name == roomName)
      if(myRoom == undefined){
        //On crée la room si elle n'existe pas
        myRoom = {"name" : roomName,"eraser" : undefined};
        rooms.push(myRoom);
      }

      var id = socket.id;
      socket.room = roomName;
      socket.join(roomName);
      console.log(id+ " rejoint la room " +roomName);

      //Atribution d'une couleur
      var color = colors[Math.floor(Math.random()*colors.length)];
      if(myRoom.eraser)
      {
        //Si il ya déjà un eraser on empeche de tomber sur la couleur de l'eraser
        color = colors.filter(color => color != backgroundColor)[Math.floor(Math.random()*(colors.length-1))]  
      }
      
      var isEraser = color == backgroundColor && myRoom.eraser == undefined ? true : false; //Si la couleur générée est la même que celle du background alors c'est l'eraser
      if(isEraser)
      {
        myRoom.eraser = { "id" : id, "color" : color,"isEraser" : isEraser}; // On modifie l'eraser en cours si il n'existe pas déjà 
        rooms[rooms.findIndex((room => room.name == roomName))].eraser = myRoom.eraser;
      }

      peoples[peoples.findIndex((person => person.id == id))] = { "id" : id, "color" : color, "isEraser" : isEraser};

      socket.emit("me", {
        "id" : id,
        "color" : color,
        "isEraser" : isEraser, //Propriété pour savoir si l'utilisateur est l'eraser ou non
      });

      io.in(roomName).emit("userList", getClientsInARoom(roomName));
      socket.broadcast.to(socket.room).emit('userJoinedRoom', '(pseudo) joined the room'); //on changera plus tard avec son vrai pseudo

      var infosRooms = new Array();
      rooms.forEach(function(room){
          infosRooms.push({"name" : room.name,"people" : getClientsInARoom(room.name)});
      });

      io.emit('updateRooms', infosRooms);
    });




    socket.on('clear', function(){
      io.in(socket.room).emit("clear");
    });




    //Transfer coordinates
    socket.on('drawing', function(coordinates, strokeWidth){

      var objectToSend = {
       "coordinates" : coordinates,
       "drawer" : socket.id,
       "strokeWidth" : strokeWidth,
     };
      socket.broadcast.to(socket.room).emit("receiveDrawing", objectToSend);
    });




    // On traite le cas ou l'utilisateur veut une nouvelle couleur
    socket.on("askColor", function(){
        var myRoom = getMyRoom(socket.room);
        var id = socket.id;  //On récupère l'id de l'utilisateur qui a émit le socket
        var color = colors[Math.floor(Math.random()*colors.length)]; // On génère une couleurs aléatoire grâce à la liste
        var isEraser = color == backgroundColor ? true : false; //Si la couleur généré est la meme que celle du background alors c'est l'eraser
        if(isEraser)
        {
            getClientsInARoom(socket.room).forEach(person => 
            { //Il ne peut y avoir que 1 eraser au maximum donc on modifie l'ancien eraser
              if(myRoom.eraser != undefined && person.id == myRoom.eraser.id) 
              {
                person.color = colors.filter(color => color != backgroundColor)[Math.floor(Math.random()*(colors.length-1))]; // On genere une couleur
                person.isEraser = false;
                socket.to(myRoom.eraser.id).emit('newColor', {
                  "id" : myRoom.eraser.id,
                  "color" : person.color,
                  "isEraser" : person.isEraser, //on notifie l'ancien eraser qu'il ne l'est plus
                });
              }
            });
          myRoom.eraser = { "id" : id, "color" : color,"isEraser" : isEraser}; //on met a jour l'eraser
          console.log("nouvel eraser : "+JSON.stringify(myRoom.eraser))
        }
        peoples[peoples.findIndex((person => person.id == id))].isEraser = isEraser; // On modifie la propriété isEraser de la personne qui demande la couleur
        peoples[peoples.findIndex((person => person.id == id))].color = color;
        
        console.log(peoples);
        
        // On émet un socket vers cet utilisateur avec la nouvelle couleur
        socket.emit("newColor", 
        {
          "id" : id,
          "color" : color,
          "isEraser" : isEraser,
        });

        io.in(socket.room).emit("userList", getClientsInARoom(socket.room));
    });


    

    socket.on("disconnect", function(){
        console.log("bye bye "+socket.id);
        peoples.splice(arrayObjectIndexOf(peoples, socket.id, "id"), 1);
	      displayNumberOfConnectedUsers();
        if(socket.room != undefined){
          if(getMyRoom(socket.room).eraser != undefined && socket.id == getMyRoom(socket.room).eraser.id)
          {
            getMyRoom(socket.room).eraser = undefined;
          }
          socket.broadcast.to(socket.room).emit('userLeftRoom', '(pseudo) left the room'); //on changera plus tard avec son vrai pseudo
          //s'il était seul dans la room on delete la room
          //Socket io fait automatiquement un socket.leave, donc on teste si la room contient encore des users ou si elle est undefined
          if(io.sockets.adapter.rooms[socket.room] == undefined)
            rooms.splice(arrayObjectIndexOf(rooms, socket.room, "name"), 1);
        }
        var infosRooms = new Array();
        rooms.forEach(function(room){
            infosRooms.push({"name" : room.name,"people" : getClientsInARoom(room.name)});
        });
        io.emit('updateRooms', infosRooms);
        io.emit('updateNumberOfConnectedUsers', peoples.length);
        //displayEraser();
    })
});

function getMyRoom(roomName){
  return rooms[rooms.findIndex((room => room.name == roomName))];
}

function arrayObjectIndexOf(myArray, searchTerm, property) {
    for(var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property] === searchTerm) return i;
    }
    return -1;
}

function displayNumberOfConnectedUsers(){
    console.log("Nombre de personnes connectées : " + peoples.length);
}
function displayEraser(){
    console.log("leraser actuel est " + JSON.stringify(eraser));
}
function getClientsInARoom(roomName){
  var clients_in_the_room = Object.keys(io.sockets.adapter.rooms[roomName].sockets);
  return peoples.filter(people => clients_in_the_room.indexOf(people.id) > -1);
}