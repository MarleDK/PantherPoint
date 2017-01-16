
$(function(){
  $("#apps").append('<div id="snake" style="display:none"></div>')
  $("#snake").load("/apps/snake/client.html #game")

  $("#btn_snake_left").click(function(){

  })

  $("#btn_snake_right").click(function(){
    room.replace({type:"move"})
  })
})
