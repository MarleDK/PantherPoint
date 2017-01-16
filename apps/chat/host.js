var chat = {
  activityName: 'chat',

  print: function (msg, sender) {
    $("#chat_host").prepend( '<p><strong>'+sender+':</strong> '+msg+'</p><hr />' );
  },

  init: function(){
    $("#log").hide()
    $("#activity").html('<div id="chat_host"></div>');
    room.watch({type:'msg'}, function(err, tuple) {
      chat.print(tuple.data.msg,tuple.data.from)
    })
  }
}

listOfViews.push(chat)
