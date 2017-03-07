(function() {
  var App;
  var oldX, oldY;
  var x, y;

  App = {};

  function arrayObjectIndexOf(myArray, searchTerm, property) {
      for(var i = 0, len = myArray.length; i < len; i++) {
      	//console.log(myArray[i]);
      	//console.log(myArray[i]);
          if (myArray[i][property] === searchTerm) return i;
      }
      return -1;
  }
  /*
  	Init
  */
  App.init = function() {
    App.canvas = document.createElement('canvas');
    App.canvas.height = window.innerHeight - 80;
    App.canvas.width = window.innerWidth - 80;
    document.getElementsByTagName('article')[0].appendChild(App.canvas);
    App.ctx = App.canvas.getContext("2d");
    App.ctx.fillStyle = "solid";
    App.ctx.strokeStyle = "#ECD018";
    App.ctx.lineWidth = 4;
    App.ctx.lineCap = "round";
    App.socket = io.connect('http://192.168.1.56:3000');

    App.me = {};

    var peoples = new Array();

    App.socket.on('userList', function(data){
      peoples = data
      console.log(data);
    })

    App.socket.on('me', function(data) {
      console.log(data);
      App.me = data;
    });

    App.socket.on('receiveDrawing', function(data) {
      console.log(peoples);
      console.log(peoples[arrayObjectIndexOf(peoples, data.drawer, "id")].color);
      return App.draw(data.coordinates, peoples[arrayObjectIndexOf(peoples, data.drawer, "id")].color);
    });

    App.draw = function(data, color) {
      console.log(data);
      console.log(color + "is drawing");
      App.ctx.strokeStyle = color;
      App.ctx.beginPath();
      App.ctx.moveTo(data.old.x, data.old.y);
      App.ctx.lineTo(data.new.x, data.new.y);
      App.ctx.stroke();
      return App.ctx.closePath();
    };
    App.socket.emit('login', '');

  };
  /*
  	Draw Events
  */
  $('canvas').live('drag dragstart dragend', function(e) {
    var offset, type;
    type = e.handleObj.type;

    oldX = x;
    oldY = y;
    x = e.offsetX;
    y = e.offsetY;

    var objectToSend = {
     "old" : {x:oldX, y:oldY},
     "new" : {x:x, y:y}
   };

    App.socket.emit('drawing', objectToSend);
    App.draw(objectToSend, App.me.color);

  });

  $(function() {
    return App.init();
  });
}).call(this);
