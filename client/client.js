
// The backend node.js server IP to connect to
var server_url = "http://"+window.location.hostname+":3000";;

  listOfViews = [{name:'login',init:function(){}},{name:'none',init:function(){}}]
  const timeToKeepAlive = 1000*60*3

  var print = function(msg){
    $("#log").prepend( $("<p>").text(msg) );
  };

  var socket = io.connect(server_url);
  var linda = new Linda().connect(socket);
  var main;
  var room;
  var name;
  var code;
  var currentView;

  linda.io.on("connect", function(){
    console.log("connected to distributing server " + server_url + "/main");
    main = linda.tuplespace("hosts")
  });

  var updateView = function (activity) {
    if(activity !== currentView){
      currentView = activity;
      listOfViews.forEach(function (view) {
        if(view.name == activity){
          view.init()
          setTimeout(function() {
            $("#"+view.name).fadeIn();
            $("#"+view.name).show();
          }, 400);
        } else {
          $("#"+view.name).fadeOut();
          setTimeout(function() {
            $("#"+view.name).hide()
          }, 400);

        }
      })
    }
  }

  var watchHost = {

    init: function(ts, name) {
      var actWatch = ts.watch({type:"activity"},function(err,tuple){
        if (tuple !== null) {
          updateView(tuple.data.activity)
        }
      });


      //Denne function replacer spilleren's tuple i tuple-spacet, så den ikke udløber
      var keepAlive = setInterval(function(){
        ts.replace({type: "player", name: name},{type: "player", name: name});
      },timeToKeepAlive);

      //Denne del sletter watch functioner, så de ikke kører mere, hvis host'en ikke er connected til tuple-spacet mere
      //Og sletter setInterval's

      var checkHostAlive = setInterval(function(){
        ts.readp({type:"hostActive"}, function(err, tuple){
          if(tuple == null){
            watchHost.close(hostObject);
          }
        });
      },timeToKeepAlive);

      var hostObject = {ts: ts, actWatch: actWatch, keepAlive: keepAlive, checkHostAlive: checkHostAlive};
      return hostObject;
    },

    close: function(hostObject) {
      hostObject.ts.cancel(hostObject.actWatch)
      clearInterval(hostObject.keepAlive)
      clearInterval(hostObject.checkHostAlive)
    }

  };

  // on page load
  $(function(){
    var hostWatcher;

    // on connect button click
    $("#btn_connect").click(function(){
      $("#err_msg").html("")
      name = $("#navnefelt").val();
      code = $("#tekstfelt").val();

      // Check if the room tuple exists
      main.readp({type: 'room', room: code}, function(err, tuple){
        if(tuple == null){
          $("#err_msg").html("Error: Room does not exist")
        } else {
          room = linda.tuplespace(code);

          // Checks if there is a player with the same name already in the tuple
            room.readp({type: 'player', name: name}, function(err2, tuple2){
                if(tuple2 !== null){
                    $("#err_msg").html("Error: Player name is already in room")
                } else {

                  // Put the player inside the tuple -- connection established
                  hostWatcher = watchHost.init(room, name);
                  room.write({type: "player", name: name});
                  $("#btn_logout").show();
                  $("#host_name").html("Connected to: "+code)
                  room.read({type:"activity"}, function(err1, tuple1){
                      updateView(tuple1.data.activity)
                  })
                }
            })
          }
        })
    });

    // Logout button function, when a user clicks, remove the tuple with the players name
    $("#btn_logout").click(function(){
        room.take({type: 'player', name: name}, function(err, tuple){
            updateView("login");
            watchHost.close(hostWatcher)
        });
        $("#btn_logout").hide();
    })


    // connects to host using the ENTER key instead of having to click the button
    $(document).keypress(function(e) {
      if(e.which == 13) {
        $("#btn_connect").click()
      }
    })
  });
