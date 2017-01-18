var snake = {
  activityName: 'snake',
  canvas: '',
  ctx: '',
  width: '',
  height: '',
  cellWidth: 4,
  direction: '',
  snakes: [],
  isRunning: false,

  init: function() {
    if(snake.isRunning){
      return
    }
    snake.isRunning = true;
    $canvas = $('canvas')
    $('canvas').show();
    snake.canvas = $('canvas')[0];
    snake.ctx = snake.canvas.getContext("2d");
    snake.width = $canvas.width();
    snake.height = $canvas.height();
    snake.canvas.width = snake.width;
    snake.canvas.height = snake.height;
    snake.cellWidth = 4;
    snake.snakes = [];

    room.readAll({type: 'player'}, function (err, list) {
      list.forEach( function(player, index) {
        var name = player.data.name;
        var length = 8;
        var color = "#"+((1<<24)*Math.random()|0).toString(16);
        console.log(name+' '+color)
        room.write({type: 'color', name: name, color: color})
        var start_dir = Math.floor(Math.random() * 4);
        var dir = snake.getDirection(start_dir);
        var start_x = Math.floor(Math.random()*((snake.width/snake.cellWidth-20)-20+1)+20);
        var start_y = Math.floor(Math.random()*((snake.height/snake.cellWidth-20)-20+1)+20);
        snake.snakes.push({name: name, color: color, direction: dir, move: 0, coords: [{x: start_x, y:start_y}]});
      });

      snake.initial();
    });

    },

  getDirection: function(dirInt) {
    if (dirInt > 3) {
      return dirInt%4;
    } else if (dirInt < 0) {
      return snake.getDirection(dirInt+4);
    } else {
      return dirInt;
    }
  },

  initial: function() {
    snake.ctx.fillStyle = "#BADA55";
    snake.ctx.fillRect(0, 0, snake.width, snake.height);
    var moveWatchId = room.watch({type:"move"}, function(err1, tuple1){
      if (tuple1) {
        var movingSnake = snake.snakes.find(function(x) {
          return x.name == tuple1.data.name
        })
        if(typeof movingSnake == 'undefined'){
          return
        } else {
          movingSnake.move = tuple1.data.direction
        }
      }
    });

    var time = 4;
    (function myLoop (i) {
      setTimeout(function () {
        if (i === 0) {
          console.log("starting...");
          if(typeof game_loop != "undefined") clearInterval(game_loop);
          var game_loop = setInterval(function(){snake.paint(game_loop,moveWatchId)}, 50);
        } else {
          console.log("starting in " + i + " seconds");
        }
        if (i--) myLoop(i);
      }, 1000)
    })(--time);
  },

  paint_cell: function(x, y, color) {
    snake.ctx.fillStyle = color;
    snake.ctx.fillRect(x*snake.cellWidth, y*snake.cellWidth, snake.cellWidth, snake.cellWidth);
  },

  check_collision: function(x, y) {
    var b = false;
    snake.snakes.forEach(function(currentSnake) {
      currentSnake.coords.forEach(function(coord){
        if(coord.x == x && coord.y == y){
          b = true;
        }
      })
    });
    return b;
  },

  paint: function(game_loop, moveWatchId) {
    snake.snakes.filter(function(x){return x.name !== null}).forEach(function(currentSnake) {
      var nx = currentSnake.coords[0].x;
      var ny = currentSnake.coords[0].y;
      currentSnake.direction = snake.getDirection(currentSnake.direction+currentSnake.move)
      var d = currentSnake.direction;

      currentSnake.move = 0;
      if(d == 0) nx++;
      else if(d == 1) ny++;
      else if(d == 2) nx--;
      else if(d == 3) ny--;

      if(nx == -1 || nx == Math.ceil(snake.width/snake.cellWidth) || ny == -1 || ny == Math.ceil(snake.height/snake.cellWidth) || snake.check_collision(nx, ny))
      {
        room.write({type:'dead', name:currentSnake.name})

        currentSnake.name = null;
        var aliveSnakes = snake.snakes.filter(function(x){return x.name !== null})
        if(aliveSnakes.length == 1){
          room.write({type:'winner', name:aliveSnakes[0].name})
          snake.ctx.font = "50px Arial";
          snake.ctx.textAlign = "center";
          snake.ctx.strokeText("The winner is " + aliveSnakes[0].name, snake.canvas.width/2, snake.canvas.height/2);
          snake.ctx.fillText("The winner is " + aliveSnakes[0].name, snake.canvas.width/2, snake.canvas.height/2);
          snake.close(game_loop, moveWatchId)
        } else if(aliveSnakes.length == 0){
          snake.close(game_loop, moveWatchId)
        }
        return;
      }

      var tail = {x: nx, y: ny};
      currentSnake.coords.unshift(tail);

      for(var i = 0; i < currentSnake.coords.length; i++)
      {
        var c = currentSnake.coords[i];
        snake.paint_cell(c.x, c.y, currentSnake.color);
      }
    });
  },

  close: function(game_loop, moveWatchId){
    room.cancel(moveWatchId)
    clearInterval(game_loop)
    kickAll(room)
    setTimeout(function(){
      room.takeAll({type:'move'},function(err, tuple){})
      room.takeAll({type:'color'},function(err, tuple){})
      room.takeAll({type:'dead'},function(err, tuple){})
      room.replace({type:'activity'},{type:'activity',activity:'none'})
      snake.isRunning = false;
    },5000)
  }
}

listOfViews.push(snake)
