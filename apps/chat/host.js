var chat = {
  activityName: 'chat',
  isRunning: false,

  print: function (msg, sender) {
    $("#chat_host").prepend( '<p><strong>'+sender+':</strong> '+msg+'</p><hr />' );
  },

  init: function(){
    if(chat.isRunning){
      return
    }
    chat.isRunning = true;
    $("#log").hide()
    $("#activity").html('<div id="chat_host"></div>');
    room.watch({type:'msg'}, function(err, tuple) {
      chat.print(tuple.data.msg,tuple.data.from)
    })
  }
}

listOfViews.push(chat)
