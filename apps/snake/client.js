
function moveFunc(dir){
  room.replace({type:"move", name: name},{type:"move", name: name, direction: dir});
}

$(function(){
  $("#apps").append('<div id="snake" style="display:none"></div>')
  $("#snake").load("/apps/snake/client.html #game")

  $("#apps").delegate("#btn_snake_left", 'click', function(){
    moveFunc(-1)
  })

  $("#apps").delegate("#btn_snake_right", 'click', function() {
    moveFunc(1)
  })

  $(document).keydown(function(e) {
    switch(e.which) {
        case 37: // left
          moveFunc(-1)
        break;

        case 39: // right
          moveFunc(1)
        break;

        default: return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
});

})
