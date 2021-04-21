//settings
var tickTime = 500;//time in ms each tick takes
var Sandbox = false;

var GameSize = 10;
//used to display win message
const colormap = ["Red", "Blue", "Green", "Purple"]

let playerNum = 2;
var game = document.getElementById("game");
var gameCont = document.getElementById("gameCont");
var playerBanner = document.getElementById("curPlayer");
var AcceptingInput = false;
let PlayerOrder = [];
let ThisPlayer = 0;
let CurrentPlayer = 0;//id of current player in PlayerOrder
let Host = false;

//All possible player positions
var AllPossiblePlayerPositions;

//Possible positions, after we know number of players
let ActualPlayerPositions;




//connect to server
var body = document.getElementById("body");
var ConnectionStateDiv = document.getElementById("ConnectionState");

var websocketPath = "ws://" + window.location.host + window.location.pathname;
var socket = new WebSocket(websocketPath);
console.log("Connecting to: ", websocketPath);
socket.onerror = (err) => {
    console.log(err);
}
socket.onclose = (err)=>{
    alert("Connection lost");
    console.log(err);
};
socket.onopen = () => {
    ConnectionStateDiv.innerText = "Connected to server. Awaiting game data.";
}

let config;
let updates;

socket.onmessage = RecieveFirstData;
function RecieveFirstData({ data }) {
    data = JSON.parse(data);
    Host = data.Host;
    if (Host) {
        ConnectionStateDiv.innerText = "Host. Generating and sending data";
    } else {
        ConnectionStateDiv.innerText = "Not Host. Awaiting game data";
    }
    config = data.config;
    updates = data.updates;
    console.log("Recieved initial data ", data);

    playerNum = updates.WaitingPlayers;
    GameSize = config.GameSize;

    AllPossiblePlayerPositions = [//column first
        [1, 1],//top left
        [GameSize - 2, 1], //top right
        [GameSize - 2, GameSize - 2], //bottom right
        [1, GameSize - 2]//bottom left
    ];

    socket.onmessage = RecieveThisPlayer;

    if (Host) {
        StartGame();
    }
}
function showThisPlayer(){
    AcceptingInput = true;
    socket.onmessage = recieveClick;

    let text = document.createElement("p");
    ConnectionStateDiv.innerText = "";
    ConnectionStateDiv.appendChild(text);
    let PlayButton = document.createElement("button");
    ConnectionStateDiv.appendChild(PlayButton);
    text.innerText = "You play as " + colormap[PlayerOrder[ThisPlayer]] + " ";
    PlayButton.innerText = "Play";
    PlayButton.onclick = () => {
        body.className = "";
        ConnectionStateDiv.remove();
    }
}
function recieveGameData({ data }) {
    let GameData = JSON.parse(data);
    PlayerOrder = GameData.PlayerOrder;
    ActualPlayerPositions = GameData.ActualPlayerPositions;
    StartGame();
    showThisPlayer();
}
function RecieveThisPlayer({ data }) {
    data = Number(data);
    ThisPlayer = data;
    if (Host) {
        showThisPlayer();
    } else {
        socket.onmessage = recieveGameData;
    }

}
function recieveClick({ data }) {
    if(CurrentPlayer==ThisPlayer)return;
    console.log(data);
    data = JSON.parse(data);
    console.log("Click: ", data);
    let e = {};
    let square = GetElByPos([data.col, data.row]);
    e.target = {};
    e.target.sq = square;
    click(e);
}
function sendClick(e) {
    let square = e.target.sq;
    socket.send(JSON.stringify({
        col: square.col,
        row: square.row
    }));
}

var squareArray = [];
function GetElByPos(pos) {
    return squareArray[pos[0] + (pos[1] * GameSize)];
}


function updateElNum(el) {
    let num = el.num;
    el.txt.textContent = num;
    el.dataset.num = num;
}
function sleep(ms) {
    return new Promise((res) => {
        setTimeout(() => {
            res();
        }, ms)
    })
}
let NeedsProcessing = [];
let WillNeedProcessing = [];
async function processGame() {
    const dirMap = {
        left: [-1, 0],//column is first, this is added to coords to get new ones
        right: [1, 0],
        up: [0, -1],
        down: [0, 1],
        nomove: [0, 0] 
    }
    for (let el of NeedsProcessing) {
        el.num++;
        updateElNum(el);
        el.className = el.capturedBy;
        el.txt.style.color = "white";
    }
    await sleep(0);
    let ShowShangePromise = sleep(tickTime);

    for (let el of NeedsProcessing) {
        if (el.num > 3) {
            let dirs = [];
            if (el.col > 0) {
                dirs.push("left");
            }
            if (el.col < GameSize - 1) {
                dirs.push("right");
            }
            if (el.row > 0) {
                dirs.push("up");
            }
            if (el.row < GameSize - 1) {
                dirs.push("down");
            }
            if(el.num>4){
                dirs.push("nomove");
            }
            for (let dir of dirs) {
                let delta = dirMap[dir];
                let newPos = [el.col + delta[0], el.row + delta[1]];
                let newEl = GetElByPos(newPos);
                newEl.capturedBy = el.className;
                if (WillNeedProcessing.indexOf(newEl) == -1) {
                    WillNeedProcessing.push(newEl);
                }else{
                    newEl.num++;
                }
            }
        }
    }
    await ShowShangePromise;
    for (let el of NeedsProcessing) {
        if (el.num > 3) {
            el.className = "Fnoone";
            el.num = 0;
            el.txt.textContent = "";
        }
        el.txt.style.color = "inherit";
    }
    NeedsProcessing = WillNeedProcessing.slice();
    WillNeedProcessing = [];
    if (NeedsProcessing.length == 0) {
        return;
    }
    await processGame();

}
function CheckIsGameOver() {
    let Players = [];
    for (let el of squareArray) {
        if (Players.indexOf(el.className) == -1 && el.className != "Fnoone")
            Players.push(el.className);
    }
    if (Players.length < PlayerOrder.length) {
        let PlayerNums = [0, 1, 2, 3];
        for (let el of Players) {
            let num = Number(el.slice(-1));
            let id = PlayerNums.indexOf(num);
            PlayerNums.splice(id, 1);
        }
        //PlayerNums are those who are dead
        for (let el of PlayerNums) {
            let id = PlayerOrder.indexOf(el);
            if (id != -1) {
                PlayerOrder.splice(id, 1);
                playerNum--;
                if(id<ThisPlayer){
                    ThisPlayer--;
                }
            }
        }
    }
    return {
        bool: Sandbox ? false : Players.length < 2,
        player: Players[0]
    };
}
function showCurrentPlayer() {
    playerBanner.className = "Fbp" + PlayerOrder[CurrentPlayer];
};
async function click(e) {
    if (!AcceptingInput) return;
    AcceptingInput = false;
    let el = e.target.sq;
    /* el = {
     *   dataset:{ 
     *      row,col,num
     *   }
     * }
     */
    let data = el.dataset;
    console.log(el.col + " " + el.row);

    if ("Fp" + PlayerOrder[CurrentPlayer] != el.className && !Sandbox) {
        AcceptingInput = true;
        return;
    }

    el.capturedBy = el.className;
    NeedsProcessing.push(el);
    await processGame();
    let IsGameOver = CheckIsGameOver();
    CurrentPlayer++;
    if (CurrentPlayer >= playerNum) CurrentPlayer = 0;
    showCurrentPlayer();
    AcceptingInput = !IsGameOver.bool;
    if (IsGameOver.bool) {
        socket.close();
        alert("Player " + colormap[IsGameOver.player.slice(-1)])
    }
}
function RealClick(e) {
    if(CurrentPlayer!=ThisPlayer)return;
    click(e);
    sendClick(e)
}


function StartGame() {
    gameCont.style.display = "flex";

    if (GameSize < 4) GameSize = 4;

    let prop = "repeat(" + GameSize + ", 1fr)"
    game.style.setProperty("grid-template-columns", prop);
    game.style.setProperty("grid-template-rows", prop);

    //game.style.display="grid";
    //val squareTemplate = document.getElementById("squareTemplate");



    for (let row = 0; row < GameSize; row++) {
        for (let col = 0; col < GameSize; col++) {
            let square = document.createElement("div");
            let txt = document.createElement("div");
            let cont = document.createElement("div");
            cont.sq = square;
            square.txt = txt;
            cont.txt = txt;
            //square.classList = "square";
            square.txt.textContent;
            //square.dataset.col = col;
            //square.dataset.row = row;
            square.num = 0;
            square.col = col;
            square.row = row;
            square.className = "Fnoone";
            cont.appendChild(square);
            cont.appendChild(txt);
            game.appendChild(cont);
            squareArray.push(square);
            cont.onclick = RealClick;
        }
    }
    {
        if (Host) {
            switch (playerNum) {
                case 2:
                    if (Math.random() * 2 > 1) {
                        ActualPlayerPositions = [AllPossiblePlayerPositions[0], AllPossiblePlayerPositions[2]] //top left and bottom right
                    } else {
                        ActualPlayerPositions = [AllPossiblePlayerPositions[1], AllPossiblePlayerPositions[3]] //top right - bottom left
                    }
                    break;
                case 3:
                    let Empty = Math.floor(Math.random() * 4);
                    ActualPlayerPositions = AllPossiblePlayerPositions.slice();
                    ActualPlayerPositions.splice(Empty, 1);
                    break;
                case 4:
                    ActualPlayerPositions = AllPossiblePlayerPositions;
                    break;
            }
        }
        for (let id in ActualPlayerPositions) {
            let el = GetElByPos(ActualPlayerPositions[id]);
            el.className = "Fp" + (Number(id));
            el.num = 3;
            updateElNum(el);
        }
        if (Host) {
            for (let id = 0; id < playerNum; id++) {
                do {
                    var potentialPlayer = Math.floor(Math.random() * playerNum);
                } while (PlayerOrder.indexOf(potentialPlayer) != -1);
                PlayerOrder.push(potentialPlayer);
            }
            socket.send(JSON.stringify(PlayerOrder));
            socket.send(JSON.stringify({ PlayerOrder: PlayerOrder, ActualPlayerPositions: ActualPlayerPositions }));
        }
    }
    //textFit(squareArray);
    var fontSize = (88 / GameSize);
    function resizeText() {
        game.style.fontSize = fontSize + "vmin";
    }
    resizeText();
    window.addEventListener("resize", resizeText);
    showCurrentPlayer();
}