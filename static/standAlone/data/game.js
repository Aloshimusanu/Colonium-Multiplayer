//settings
var tickTime = 500;//time in ms each tick takes
var Sandbox = true;

var GameSize = 10;
//used to display win message
const colormap = ["Red", "Blue", "Green", "Purple"]

//Menu
let playerNum = 2;
menu = document.getElementById("menu");
SizeInput = document.getElementById("GameSize");
var game = document.getElementById("game");
var gameCont = document.getElementById("gameCont");
var playerBanner = document.getElementById("curPlayer");
var AcceptingInput = false;
let PlayerOrder = [];
let CurrentPlayer = 0;//id of current player in PlayerOrder
for (let num = 2; num < 5; num++) {
    let button = document.createElement("button");
    button.innerText = num;
    button.num = num;
    button.onclick = (e) => {
        playerNum = e.target.num;
        menu.style.display = "none";
        gameCont.style.display = "flex";

        GameSize = Number(SizeInput.value) || GameSize;
        if(GameSize<4)GameSize=4;

        let prop = "repeat(" + GameSize + ", 1fr)"
        game.style.setProperty("grid-template-columns", prop);
        game.style.setProperty("grid-template-rows", prop);

        StartGame();
    }
    menu.appendChild(button);
}
menu.appendChild(SizeInput);

function StartGame() {
    //game.style.display="grid";
    var squareArray = [];
    //val squareTemplate = document.getElementById("squareTemplate");
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
    function GetElByPos(pos) {
        return squareArray[pos[0] + (pos[1] * GameSize)];
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
        if(Players.length<PlayerOrder.length){
            let PlayerNums = [0,1,2,3];
            for(let el of Players){
                let num = Number(el.slice(-1));
                let id = PlayerNums.indexOf(num);
                PlayerNums.splice(id,1);
            }
            //PlayerNums are those who are dead
            for(let el of PlayerNums){
                let id = PlayerOrder.indexOf(el);
                if(id!= -1){
                    PlayerOrder.splice(id,1);
                    playerNum--;
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
            alert("Player " + colormap[IsGameOver.player.slice(-1)])
        }
    }

    for (let row = 0; row < GameSize; row++) {
        for (let col = 0; col < GameSize; col++) {
            let square = document.createElement("div");
            let txt = document.createElement("div");
            let cont = document.createElement("div");
            cont.sq=square;
            square.txt=txt;
            cont.txt=txt;
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
            cont.onclick = click;
        }
    }
    {
        //All possible player positions
        const All = [//column first
            [1, 1],//top left
            [GameSize - 2, 1], //top right
            [GameSize - 2, GameSize - 2], //bottom right
            [1, GameSize - 2]//bottom left
        ];
        //Possible positions, after we know number of players
        let Actual;

        switch (playerNum) {
            case 2:
                if (Math.random() * 2 > 1) {
                    Actual = [All[0], All[2]] //top left and bottom right
                } else {
                    Actual = [All[1], All[3]] //top right - bottom left
                }
                break;
            case 3:
                let Empty = Math.floor(Math.random() * 4);
                Actual = All.slice();
                Actual.splice(Empty, 1);
                break;
            case 4:
                Actual = All;
                break;
        }
        for (let id in Actual) {
            let el = GetElByPos(Actual[id]);
            el.className = "Fp" + (Number(id));
            el.num = 3;
            updateElNum(el);
        }
        for (let id = 0; id < playerNum; id++) {
            do {
                var potentialPlayer = Math.floor(Math.random() * playerNum);
            } while (PlayerOrder.indexOf(potentialPlayer) != -1);
            PlayerOrder.push(potentialPlayer);
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
    AcceptingInput = true;
}