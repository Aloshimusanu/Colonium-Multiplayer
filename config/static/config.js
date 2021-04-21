var websocketPath ="ws://" + window.location.host + window.location.pathname;
var socket = new WebSocket(websocketPath);
console.log("Connecting to: ", websocketPath);
socket.onerror = (err)=>{
    console.log(err);
}
socket.onclose = socket.onerror;
socket.onopen = ()=>{
    socket.send('{"txt":"Hello"}');
}

function sendObj(command){
    socket.send(JSON.stringify(command));
}

var views = {
    WaitingPlayers: document.getElementById("WaitingPlayers"),
    StartButton: document.getElementById("StartButton"),
    GameSize: document.getElementById("GameSize")
}

var config = {};
var updates={
    set WaitingPlayers(value){
        views.WaitingPlayers.textContent=value;
    }
};

views.StartButton.onclick = ()=>{
    config.GameSize = Number(views.GameSize.value);
    sendObj(config);
    var command = {
        command: "START"
    }
    sendObj(command);
}


socket.onmessage=RecieveFirstData;
function RecieveFirstData({data}){
    data = JSON.parse(data);
    config=data.config;
    for(const [key,value] of Object.entries(data.updates)){
        updates[key]=value;
    }
    console.log("Recieved initial data ", data);
    socket.onmessage = recieveUpdates;
}
function recieveUpdates({data}){
    console.log(data);
    data = JSON.parse(data);
    //data[0] is propertyName, data[1] is property value;
    updates[ data[0] ]=data[1];
    console.log(data[0]," updated to ", data[1]);
}
console.log("Script Run");