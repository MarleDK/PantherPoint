var snake = {
  activityName: 'snake',
  canvas: '',
  ctx: '',
  width: '',
  height: '',
  cellWidth: 4,
  direction: '',
  snakes: [],

  init: function() {
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
      var movingSnake = snake.snakes.find(function(x) {
        return x.name == tuple1.data.name
      })
      if(typeof movingSnake == 'undefined'){
        return
      } else {
        movingSnake.move = tuple1.data.direction
      }
    });

    if(typeof game_loop != "undefined") clearInterval(game_loop);
    var game_loop = setInterval(function(){snake.paint(game_loop,moveWatchId)}, 50);
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
        currentSnake.name = null;
        var aliveSnakes = snake.snakes.filter(function(x){return x.name !== null})
        if(aliveSnakes.length == 1){
          /////////////Lav noget print af vinder
          console.log("The winner is found")
          snake.close(game_loop, moveWatchId)
        } else if(aliveSnakes.length == 0){

          console.log("No winner found")
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
    console.log(moveWatchId + ' '+ game_loop)

    clearInterval(moveWatchId)
    clearInterval(game_loop)
    setTimeout(function(){
      room.takeAll({type:'move'},function(err, tuple){})
      room.replace({type:'activity'},{type:'activity',activity:'none'})
    },5000)
  }
}

listOfViews.push(snake)
