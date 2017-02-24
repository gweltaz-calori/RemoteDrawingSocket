var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var colors = ["#424242","#E53935","#8E24AA","#D81B60","#00897B","#FDD835","#039BE5","#E91E63","#2196F3","#3F51B5","#4CAF50","#FFC107","#FF9800","#FFEB3B"];
var backgroundColor = "#424242";

var eraser =undefined;
var peoples = new Array();

//ExpressJS
app.use(express.static('public'));


app.get('/', function(req, res){
  res.sendFile('/index.html');
});






//Socket.io


http.listen(3000, function(){
  console.log('listening on *:3000');
});

io.on('connection', function(socket){
    console.log('user connected');

    //Show me your color
    socket.on("login", function(){
      var id = socket.id;
      var color = colors[Math.floor(Math.random()*2)];
      
      var isEraser = color ==backgroundColor && eraser ==undefined ? true : false; //Si la couleur généré est la meme que celle du background alors c'est l'eraser
      if(isEraser)
      {
        eraser = { "id" : id, "color" : color,"isEraser" : isEraser}; // On modifie l'eraser en cours si il n'existe pas déja 
      }
      peoples.push({ "id" : id, "color" : color,"isEraser" : isEraser});

      console.log(peoples);
      displayNumberOfConnectedUsers();
      displayEraser();
      socket.emit("me", {
        "id" : id,
        "color" : color,
        "isEraser" : isEraser, //Propriété pour savoir si l'utilisateur est l'eraser ou non
      });

      io.emit("userList", peoples);
    })

    socket.on('clear', function(){
      io.emit("clear");
    })

    //Transfer coordinates
    socket.on('drawing', function(coordinates){

      var objectToSend = {
       "coordinates" : coordinates,
       "drawer" : socket.id
     };
     //console.log(objectToSend);
      socket.broadcast.emit("receiveDrawing", objectToSend);
    });

    // On traite le cas ou l'utilisateur veut une nouvelle couleur
    socket.on("askColor", function(){
        
        var id = socket.id;  //On récupère l'id de l'utilisateur qui a émit le socket
        var color = colors[Math.floor(Math.random()*2)]; // On génère une couleurs aléatoire grâce à la liste
        var isEraser = color ==backgroundColor ? true : false; //Si la couleur généré est la meme que celle du background alors c'est l'eraser
        if(isEraser)
        {
          
          if(eraser !==undefined)
          {
            peoples.forEach(person => 
            { //Il ne peut y avoir que 1 eraser au maximum donc on modifie l'ancien eraser
              if(person.id == eraser.id) 
              {
                person.isEraser = false
              }
            });
          }
          
          eraser = { "id" : id, "color" : color,"isEraser" : isEraser}; //on met a jour l'eraser
        }
        console.log(peoples);
        displayEraser();
        console.log("La personne : "+id+" veut une nouvelle couleur : "+color);
        // On émet un socket vers cet utilisateur avec la nouvelle couleur
        socket.emit("newColor", 
        {
          "id" : id,
          "color" : color,
          "isEraser" : isEraser,
        });
        
    })
    socket.on("disconnect", function(){
        console.log("bye bye "+socket.id);
        peoples.splice(arrayObjectIndexOf(peoples, socket.id, "id"), 1);
	      displayNumberOfConnectedUsers();
    })
});

function arrayObjectIndexOf(myArray, searchTerm, property) {
    for(var i = 0, len = myArray.length; i < len; i++) {
    	//console.log(myArray[i]);
    	//console.log(myArray[i]);
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
