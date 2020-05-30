const io = require('socket.io')(3000);

var players = {}

checkHits = (players) => {
    for (var id in players){
      player = players[id];
      for (let bul = player.bullets.length - 1; bul >= 0; bul--){
        player.bullets[bul].x += player.bullets[bul].dx;
        player.bullets[bul].y -= player.bullets[bul].dy;
        for (var id2 in players){
          if (id != id2){
            player2 = players[id2];
            if (Math.abs(player.bullets[bul].x - player2.x) + Math.abs(player.bullets[bul].y - player2.y) < 20){
              player.bullets.splice(bul,1);
              player2.hp -= 1;
              if (player2.hp == 0)
                player.score += 10;
              else
                player.score += 5;
              break;
            }
          }
        }
      }
    }
  }

explosionAnimation = (players) => {
    for (var id in players){
      player = players[id];
      if (player.hp == 0){
        player.death += 1;
      }
      if (player.death >= 250){
        delete players[id];
      }
    }
  }

io.on("connection", (socket) =>{
  socket.on('new player', () =>{
    players[socket.id] = {
      x: 300,
      y: 300,
      angle: 0,
      bullets: [],
      hp: 5,
      death: 0,
      score: 0
    };
  });

  socket.on("disconnect", (reason) => {
    console.log("Player " + socket.id + " Disconnected" );
    delete players[socket.id];
  });

  let lastPress = Date.now();

  socket.on('movement', (data) => {
    var player = players[socket.id] || {};

      if (data.left){
        player.angle += 3;
        player.angle %= 360;
      }
      if (data.up){
        player.x += Math.cos(player.angle * (Math.PI / 180)) * 3.5;
        player.y -= Math.sin(player.angle * (Math.PI / 180)) * 3.5;
      }
      if (data.right){
        player.angle -= 3;
        player.angle %= 360;
      }
      if (data.down){
        player.x -= Math.cos(player.angle * (Math.PI / 180)) * 3.5;
        player.y += Math.sin(player.angle * (Math.PI / 180)) * 3.5;
      }
      if (data.space){
        const nowPress = Date.now();
        if (nowPress - lastPress > 500)
        {
          lastPress = nowPress;
          player.bullets.push({
            "id":player.bullets.length+1, 
            "x": player.x, 
            "y": player.y, 
            "dx": Math.cos(player.angle * (Math.PI / 180)) * 3,
            "dy": Math.sin(player.angle * (Math.PI / 180)) * 3
          })
        }
      }
  });

  setInterval( () => {
    checkHits(players);
    explosionAnimation(players);
    io.sockets.emit('state', players);
  }, 1000/60);
});