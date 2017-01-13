var snake = {
  startSnake: function($canvas, room) {
    $canvas.show();
    var canvas = $canvas[0];
    var ctx = canvas.getContext("2d");
    var width = $canvas.width();
    var height = $canvas.height();
    canvas.width = width;
    canvas.height = height;
    var cellWidth = 4;
    var direction;
    var snake_array;
    init();
  },

  init: function() {
    var start_dir = Math.floor(Math.random() * 4) + 1;
    if (start_dir == 1) d = "right";
    else if (start_dir == 2) d = "left";
    else if (start_dir == 3) d = "up";
    else if (start_dir == 4) d = "down";
    create_snake();

    if(typeof game_loop != "undefined") clearInterval(game_loop);

    game_loop = setInterval(paint, 50);
  },

  create_snake: function() {
    var length = 8;
    snake_array = []; //Empty array to start with
    var start_x = Math.floor(Math.random()*((width/cellWidth-20)-20+1)+20);
    var start_y = Math.floor(Math.random()*((height/cellWidth-20)-20+1)+20);
    console.log(start_x, start_y);
    snake_array.push({x: start_x, y:start_y});
  },

  paint_cell: function(x, y) {
    ctx.fillStyle = "black";
    ctx.fillRect(x*cellWidth, y*cellWidth, cellWidth, cellWidth);
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
    ctx.fillStyle = "#BADA55";
    ctx.fillRect(0, 0, width, height);

    var nx = snake_array[0].x;
    var ny = snake_array[0].y;

    if(d == "right") nx++;
    else if(d == "left") nx--;
    else if(d == "up") ny--;
    else if(d == "down") ny++;

    if(nx == -1 || nx == Math.ceil(width/cellWidth) || ny == -1 || ny == Math.ceil(height/cellWidth) || check_collision(nx, ny, snake_array))
    {
      init();
      return;
    }

    var tail = {x: nx, y: ny};
    snake_array.unshift(tail);

    for(var i = 0; i < snake_array.length; i++)
    {
      var c = snake_array[i];
      //Lets paint 10px wide cells
      paint_cell(c.x, c.y);
    }
  }
}

$(document).keydown(function(e){
  var key = e.which;
  if(key == "37" && d != "right") d = "left";
  else if(key == "38" && d != "down") d = "up";
  else if(key == "39" && d != "left") d = "right";
  else if(key == "40" && d != "up") d = "down";
});