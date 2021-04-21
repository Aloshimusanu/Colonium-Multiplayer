'use strict';
const express = require('express');
var app = express();
const expressWs = require("express-ws")(app);

const readline = require('readline');
const natpmp = require('nat-pmp');
const path = require('path');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var port = {
  external: process.env.externalPORT || 3000,
  internal: process.env.internalPORT || 3000
}

var config = require("./config");
app.use("/config", config.router);

function STARTgame() {
  sendConfig(Host, true);
  for (const pl of AllPlayers) {
    if (Host != pl) {
      sendConfig(pl, false);
    }
  }
}
config.config.events.START = STARTgame;

function removePlayer(pl) {
  var id = AllPlayers.indexOf(pl);
  AllPlayers.splice(id, 1);
}
function passToEveryoneElseListener(ws) {
  ws.on("message", passToEveryoneElse.bind(this, ws));
}
function passToEveryoneElse(me, data) {
  for (const pl of AllPlayers) {
    if (me != pl) {
      pl.send(data);
    }
  }
  console.log("Passing");
}
var AllPlayers = [];
var Host;

app.use((req, res, next) => {
  if (config.config.WaitingPlayers > 3) {
    res.end("To many connections");
    return;
  }
  next();
});

app.get("/", (req, res) => {
  res.sendFile("./static/multiplayer/game.html", { root: module.path });
});

app.use("/", express.static(path.join(module.path, "static/multiplayer")))


function sendConfig(ws, Host) {
  ws.send(JSON.stringify({
    config: config.config.data,
    updates: config.config.updates,
    Host: Host
  }));
}
app.ws("/", (ws, req) => {
  if (config.config.WaitingPlayers > 3) {
    ws.close(4000, "To many connections");
  }
  if (/*req.hostname == "localhost" || */(process.env.FirtsIsHost == 'true' && Host == null)) {
    Host = ws;
    ws.on("close", () => {
      Host = null;
    });
    function dispenceArray(data) {
      ws.removeEventListener("message", dispenceArray);
      passToEveryoneElseListener(ws);

      data = JSON.parse(data);
      for (let id = 0; id < data.length; id++) {
        AllPlayers[id].send(data[id].toString());
        console.log("Sending Player ID ", data[id])
      }
    }
    ws.on("message", dispenceArray);
  } else {
    passToEveryoneElseListener(ws);
  }
  AllPlayers.push(ws);
  config.config.WaitingPlayers++;
  ws.on("close", () => {
    removePlayer(ws);
    config.config.WaitingPlayers--;
  });
});

var server = app.listen(port.internal, function () {
  port.internal = server.address().port;
  console.log('Express server listening on port ' + port.internal);
});




//Open to the internet
if (port.external != "none") {
  // create a "client" instance connecting to your local gateway
  var client = natpmp.connect('10.0.1.1');
  var ExternalData = {};
  client.on("error", (err) => {
    console.log(err);
  })
  // explicitly ask for the current external IP address
  client.externalIp((err, info) => {
    if (err) throw err;
    ExternalData.ip = info.ip.join('.');
    console.log('Current external IP address: %s', ExternalData.ip);
    client.close();
    PortMap();
  });
  // setup a new port mapping
  function PortMap() {
    var client = natpmp.connect('10.0.1.1');
    client.portMapping({ private: port.internal, public: port.external, ttl: 1000 }, (err, info) => {
      client.close();
      if (err) throw err;
      port.external = info.external;
      console.log(info);
      console.log("Full external address: ", "http://" + ExternalData.ip + ":" + port.external);
      console.log("Config address: ", "http://localhost:" + port.internal + "/config/");
    });
  }
  setInterval(PortMap, 900 * 1000);
}