'use strict';
const express = require('express');
var router = express.Router({strict:true});
const expressWs = require("express-ws")(router);

const path = require('path');

var config = new class {

    /**
     * @param {Number} value
     */
    set WaitingPlayers(value) {
        this.updates.WaitingPlayers = value;
        this.sendUpdate("WaitingPlayers", value);
    }
    get WaitingPlayers() {
        return this.updates.WaitingPlayers;
    }
    sendUpdate(prop, value) {
        if (this.ws != null) {
            this.ws.send(JSON.stringify([prop, value]));
        }
    }
    execConfigCommand(command) {
        //command.command is command string, all else is arguments
        switch (command) {
            case "START":
                if (this.events.START != null) this.events.START();
                break;
        }

    }
    events = {
        START: null
    }
    //data that config has to be updated about
    updates = {
        WaitingPlayers: 0
    }
    ws = null

    /**
     * @description Holds data from the config page
     */
    data = {
        GameSize: 10

    }
};

router.use((req, res, next) => {
    if (req.hostname != "localhost") {
        res.end("Config is only available from localhost.");
        return;
    }
    next();
});

router.get("/", (req, res) => {
    if(!req.originalUrl.endsWith("/")){
        res.redirect(req.originalUrl+"/");
        return;
    }
    res.sendFile("./static/config.html", { root: module.path });
});

router.use("/", express.static(path.join(module.path, "static")));

router.ws("/", (ws, req) => {
    if (config.ws == null) {
        config.ws = ws;
        ws.on('message', function (data) {
            data = JSON.parse(data);
            if (data.command != undefined) {
                config.execConfigCommand(data.command);
                return;
            }
            config.data = data;
        });
        ws.on("close", (code, reason) => {
            config.ws = null;
            console.log("Config connection closed: ", { code: code, reason: reason });
        });
        ws.send(JSON.stringify({ config: config.data, updates: config.updates }));
        console.log();
    } else {
        ws.close(4000, "Config Already Open");
    }
});

module.path
module.exports.config = config;
module.exports.router = router;