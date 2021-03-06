      var server_url = "http://"+window.location.hostname+":3000";
      var socket = io.connect(server_url);
      var linda = new Linda().connect(socket);
      var hosts = linda.tuplespace('hosts');
      var room;
      var listOfViews = [{activityName:'none', init:function(){$('canvas').hide(); $('#log').show();}}]
      const timeToKeepAlive = 60*1000*3;
      var hostRoomKeepAliveID;


      hosts.linda.io.on('connect', function () {
        console.log('connected to tuplespace: ' + hosts.name);

        hosts.take({type: 'nextRoom'}, function (err, tuple) {
          uniqueCode = generateCode(tuple.data.room);
          room = linda.tuplespace(uniqueCode);
          handleNewRoom(room);
        });
      });

      function handleNewRoom(room) {
        $('.code').text(room.name);
        hosts.write({type: 'nextRoom', room: room.name});
        hosts.write({type: 'room', room: room.name});
        room.write({type:"hostActive"});
        room.write({type:"activity", activity:"none"});
        room.watch({type: 'player'}, function (err, tuple) {
          print(tuple.data.name + " connected");
        });

        room.watch({type: 'activity'}, function (err, tuple) {
          listOfViews.forEach( x => {
            if(tuple.data.activity == x.activityName) {
              x.init();
            }

          })
        });

        room.replace({type:"hostActive"},{type:"hostActive"})
        setInterval(function(){
          room.replace({type:"hostActive"},{type:"hostActive"})
        },timeToKeepAlive)

        room.take({type: 'activity'},function(err, tuple){
          room.write({type: 'activity', activity: tuple.data.activity})
        })

        setInterval(function(){
          room.take({type: 'activity'},function(err, tuple){
            room.write({type: 'activity',activity: tuple.data.activity})
          })
        },timeToKeepAlive)


        hosts.replace({type: 'room', room: room.name},{type: 'room', room: room.name})
        hostRoomKeepAliveID = setInterval(function(){
          hosts.replace({type: 'room', room: room.name},{type: 'room', room: room.name})
        }, timeToKeepAlive)

      }

      function nextLetter (s) {
        if (!isNaN(s)) {
          var int = parseInt(s);
          if (int === 9) {
            int = -1
          }
          int += 1
          return int;
        } else {
          return s.replace(/([a-zA-Z])[^a-zA-Z]*$/, function(a){
              var c = a.charCodeAt(0);
              switch(c){
                  case 90: return 'A';
                  case 122: return 'a';
                  default: return String.fromCharCode(++c);
              }
          });
        }
      }

      function generateCode (code) {
        code = code.split("");
        for (var i = 0; i<code.length; i++) {
          code[i] = nextLetter(code[i]);
        }
        return code.join("");
      };

      function print (msg) {
        // Foldable
        $("#log").append( '<p>'+msg+'</p><hr />' );
        $("#log").scrollTop($("#log")[0].scrollHeight);
      };

      // Close button, disconnects all users and refreshes the host side
      $("#btn_close").click(function(){
          room.takeAll({}, function(err, tuple){
            hosts.take({room: room.name}, function (err, tuple) {
              console.log('Closed');
              location.reload();
            });
          });
      })

      $(function() {
        $('.activity').click(function(e){
          hosts.take({room: room.name}, function (err, tuple) {
            console.log('locked ' + tuple.data.room);
          });
          var target = $(e.target);
          room.write({type: 'activity', activity: target.data('name')});
        });
      });

      linda.io.on("connect", function() {
        console.log('😁');
      });
