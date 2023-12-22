import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import { GAME_OVER, INITIALIZE, PLAYER_ONE_STORAGE_KEY, PLAYER_TWO_STORAGE_KEY, 
  RESET } from "./constants.mjs";
import { GameController } from "./gameController.mjs";
import { EventEmitter } from "node:events";

import cors from "cors"; 

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080/*"
  }
});

app.use(cors()); 

class GameOverHandler {
  gameOverEmitter

  constructor(activeGames) {
    this.gameOverEmitter = new EventEmitter();
    this.gameOverEmitter.on(GAME_OVER, activeGameId => {
      activeGames.delete(activeGameId);
    });
  }
}

// some thoughts, we should store our own model of the current game board
// and should store which player's turn it is. 
// and when we receive a move, we should send a message to the client 
// saying which move was played and send it to the appropriate player
// how to handle a bunch of clients all joining at the same time? 
// for now, ignore  

/**
 * for now ignore the preferences of each player
 * let's create a queue, when clients connect, they join the queue
 * and if we have 2 clients ready to play, get those 2 to join a 
 * game, each game shall be a room, uniquely identified with an id
 * once a game is done, room is over. how to handle client disconnecting
 * and then reconnecting? can we pass them an id that they hold onto, 
 * and when they reconnect, they send back that id 
 */

const port = 3000;

// const activeGameRooms = [];
const activeGameRooms = new Map(); 
const needGameQueue = [];

const PLAYER_ONE_SYMBOL = "X";
const PLAYER_TWO_SYMBOL = "O";

let socketCount = 0;

const socketEventMappedHandler = {
  [PLAYER_ONE_STORAGE_KEY]: function (tileId) {
    console.log("recieved player one storage key, with tileId: " + tileId);
  },
  [PLAYER_TWO_STORAGE_KEY]: function (tileId) {
    console.log("recieved player two storage key, with tileId: " + tileId);
  },
  ["disconnect"]: function () {
    console.log("user disconnected");
  },
}

const gameOverEmitter = new GameOverHandler(activeGameRooms);

io.on('connection', socket => {
  console.log('user connected. socket id: ' + socket.id);
  socketCount++;
  console.log("Socket count: " + socketCount);

  // socket.on("rejoin", gameId => {

  // });

  registerSocketListeners(socket);

  needGameQueue.push(socket);

  if (needGameQueue.length >= 2) {
    createGame();
  }
});

// Side effect: shrinks needGameQueue by 2
function createGame() {
  const playerOneSocket = needGameQueue.shift();
  const playerTwoSocket = needGameQueue.shift();

  const roomIdLength = 60;
  const randomRoomId = randomId(roomIdLength); 

  const activeGame = new GameController(PLAYER_ONE_SYMBOL, PLAYER_TWO_SYMBOL,
    playerOneSocket, playerTwoSocket, randomRoomId, gameOverEmitter);

  activeGameRooms.set(randomRoomId, activeGame); 

  initializePlayerSockets(playerOneSocket, playerTwoSocket, randomRoomId);

  console.log("num active game rooms: " + activeGameRooms.size);
}

function initializePlayerSockets(playerOneSocket, playerTwoSocket, roomId) {
  const playerOneInitializeData = {
    playerKey: PLAYER_ONE_STORAGE_KEY, playerSymbol: PLAYER_ONE_SYMBOL,
    opponentSymbol: PLAYER_TWO_SYMBOL, roomId: roomId
  };

  const playerTwoInitializeData = {
    playerKey: PLAYER_TWO_STORAGE_KEY, playerSymbol: PLAYER_TWO_SYMBOL,
    opponentSymbol: PLAYER_ONE_SYMBOL, roomId: roomId
  }

  console.log("p1 intial data: " + JSON.stringify(playerOneInitializeData));
  console.log("p2 initial data: " + JSON.stringify(playerTwoInitializeData));

  playerOneSocket.emit(INITIALIZE, playerOneInitializeData);
  playerTwoSocket.emit(INITIALIZE, playerTwoInitializeData);
}

server.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

app.get("/rooms", function (req, res) {
  printClientInRooms().then(clientInRooms => {
    if (clientInRooms === "") {
      console.log("/rooms, no rooms ");
      clientInRooms = "/rooms no rooms. Room queues: " + activeGameRooms.size;
    } else {
      console.log("/rooms: " + clientInRooms);
    }
    res.send(clientInRooms);
  });
});

// app.get("/login", function(req, res) {
//   console.log("getting login stuff");
//   res.send("hi");
// })

app.use(express.text()); 
app.use(express.json()); 

app.post("/login", function (req, res) {
  console.log("req url " + req.url);
  console.log("req stuff: " + req.body);
  res.send("hii");
});

async function printClientInRooms() {
  let clientInRoomsStr = "";
  for (const [roomId, activeGame] of activeGameRooms) {
    const sockets = await io.in(roomId).fetchSockets();
    for (const socket of sockets) {
      clientInRoomsStr += "\n Socket in room: " + roomId + ". socket id: " 
                            + socket.id;
      console.log("Socket in room: " + roomId + ". socket id: " + socket.id);
    }
  }
  return clientInRoomsStr;
}

function registerSocketListeners(socket) {
  for (const event in socketEventMappedHandler) {
    socket.on(event, socketEventMappedHandler[event]);
  }
}

function randomId(length) {
  let randomId = "";
  for (let i = 0; i < length; i++) {
    randomId += "" + Math.round(Math.random() * 10);
  }
  return randomId;
}