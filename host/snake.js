var snake = {
  canvas: '',
  ctx: '',
  width: '',
  height: '',
  cellWidth: 4,
  direction: '',
  snakes: [],

  startSnake: function($canvas, room) {
    $canvas.show();
    snake.canvas = $canvas[0];
    snake.ctx = snake.canvas.getContext("2d");
    snake.width = $canvas.width();
    snake.height = $canvas.height();
    snake.canvas.width = snake.width;
    snake.canvas.height = snake.height;
    snake.cellWidth = 4;

    room.readAll({type: 'player'}, function (err, list) {
      list.forEach( function(player, index) {
        var name = player.data.name;
        var length = 8;
        var color = "#"+((1<<24)*Math.random()|0).toString(16);
        var start_dir = Math.floor(Math.random() * 4) + 1;
        var dir;
        if (start_dir == 1) dir = "right";
        else if (start_dir == 2) dir = "left";
        else if (start_dir == 3) dir = "up";
        else if (start_dir == 4) dir = "down";
        var start_x = Math.floor(Math.random()*((snake.width/snake.cellWidth-20)-20+1)+20);
        var start_y = Math.floor(Math.random()*((snake.height/snake.cellWidth-20)-20+1)+20);
        snake.snakes.push({name: name, color: color, direction: dir, coords: [{x: start_x, y:start_y}]});
      });
      snake.init();
    });
  },

  init: function() {
    snake.ctx.fillStyle = "#BADA55";
    snake.ctx.fillRect(0, 0, snake.width, snake.height);

    if(typeof game_loop != "undefined") clearInterval(game_loop);
    game_loop = setInterval(snake.paint, 50);
  },

  paint_cell: function(x, y, color) {
    snake.ctx.fillStyle = color;
    snake.ctx.fillRect(x*snake.cellWidth, y*snake.cellWidth, snake.cellWidth, snake.cellWidth);
  },

  check_collision: function(x, y, array) {
    for(var i = 0; i < array.length; i++)
    {
      if(array[i].x == x && array[i].y == y)
       return true;
    }
    return false;
  },

  paint: function() {
    snake.snakes.forEach(function(currentSnake) {
      var nx = currentSnake.coords[0].x;
      var ny = currentSnake.coords[0].y;

      var d = currentSnake.direction;

      if(d == "right") nx++;
      else if(d == "left") nx--;
      else if(d == "up") ny--;
      else if(d == "down") ny++;

      if(nx == -1 || nx == Math.ceil(snake.width/snake.cellWidth) || ny == -1 || ny == Math.ceil(snake.height/snake.cellWidth) || snake.check_collision(nx, ny, currentSnake.coords))
      {
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
  }
}