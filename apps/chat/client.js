var chat = {
  name: 'chat',

  init: function(){
    $("#apps").append('<div id="chat" style="display:none"></div>')
    $("#chat").load("/apps/chat/client.html #input_create")

    $("#apps").delegate("#chat_send","click",function () {
      msg = $("#msg").val();

      $("#msg").val('').focus();
      room.write({type: "msg", from: name, msg: msg});
    });

    $(document).keypress(function(e) {
      if(e.which == 13) {
        $("#chat_send").click()
      }
    })
  },

}

$(function(){
  $("#none_btns").append('<button id="btn_chat" type="button" class="btn btn-primary btn-big"> Chat </button>');

  $("#btn_chat").click(function(){
    room.takep({type:"activity"},function(err, tuple){
      if(tuple !== null){
        room.write({type:"activity",activity:"chat"})
      }
    })
  })
});

listOfViews.push(chat)
