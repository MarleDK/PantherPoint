
$(function(){
  $("#apps").append('<div id="snake" style="display:none"></div>')
  $("#snake").load("/apps/snake/client.html #game")

  $("#apps").delegate("#btn_snake_left", 'click', function(){
    room.replace({type:"move", name: name},{type:"move", name: name, direction: -1});
  })

  $("#apps").delegate("#btn_snake_right", 'click', function() {
    room.replace({type:"move", name: name},{type:"move", name: name, direction: 1});
  })
})
