/*
  This function takes a tuplespace and a list of players, and it will then
  kick all players not responding to the kick tuple
*/
function kick(ts, players){
  players.forEach(player => {
    ts.write({type:'kick', name: player})
  })
  setTimeout( () => {
    ts.takeAll({type:'kick'}, (err, tuples) => {
      tuples.forEach( tuple => {
        ts.take({type:'player',name: tuple.data.name}, () =>{})
      })
    })
  },1000)
}

function kickAll(ts){
  ts.readAll({type:'player'}, (err, tuples) => {
    const players = tuples.map(tuple => {
      return tuple.data.name
    })
    kick(ts, players)
  })
}
