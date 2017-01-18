var snake = {
  name: 'snake',

  moveFunc: function(dir){
    room.replace({type:"move", name: name},{type:"move", name: name, direction: dir});
  },

  init: function(){
    $("#apps").html('<div id="snake"></div>')
    $("#snake").load("/apps/snake/client.html #game")

    $("#apps").delegate("#btn_snake_left", 'click', function(){
      snake.moveFunc(-1)
    })

    $("#apps").delegate("#btn_snake_right", 'click', function() {
      snake.moveFunc(1)
    })

    $(document).keydown(function(e) {
      switch(e.which) {
        case 37: // left
        snake.moveFunc(-1)
        break;

        case 39: // right
        snake.moveFunc(1)
        break;

        default: return; // exit this handler for other keys
      }
      e.preventDefault(); // prevent the default action (scroll / move caret)
    
    });
    
    //sets the client background color to the same as the snake
    
    room.take({type:'color', name: name},function(err,tuple){
      $("body").css("background-color", tuple.data.color)
    })
    
    room.take({type: 'dead', name: name}, function(err, tuple){ 
      $("#msg_log").html("You are dead!");
      setTimeout(function(){ 
        $("body").css("background-color", "#FFFFFF");
      }, 5000);   
    })
  }
};

$(function(){
  $("#none_btns").append('<button id="btn_snake" type="button" class="btn btn-primary btn-big"> Snake </button>');

  $("#btn_snake").click(function(){
    room.takep({type:"activity"},function(err, tuple){
      if(tuple !== null){
        room.write({type:"activity",activity:"snake"})
      }
    })
  })
});

listOfViews.push(snake);
