import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import { GAME_OVER, INITIALIZE, PLAYER_ONE_STORAGE_KEY, PLAYER_TWO_STORAGE_KEY, RESET } from "../utils/constants.mjs";
import { GameModel } from "../backend/gameModel.mjs";
import { log } from "console";
import { EventEmitter } from "node:events";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080"
  }
});

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
const activeGameRooms = new Set();
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

const gameOverEmitter = new EventEmitter();

io.on('connection', (socket) => {
  console.log('user connected. socket id: ' + socket.id);
  socketCount++;
  console.log("Socket count: " + socketCount);

  registerSocketListeners(socket);

  needGameQueue.push(socket);

  if (needGameQueue.length >= 2) {
    const playerOneSocket = needGameQueue.shift();
    const playerTwoSocket = needGameQueue.shift();

    const roomIdLength = 10;
    const randomRoomName = "room id: " + randomId(roomIdLength);

    const activeGame = new GameModel(PLAYER_ONE_SYMBOL, PLAYER_TWO_SYMBOL,
      playerOneSocket, playerTwoSocket, randomRoomName, gameOverEmitter);

    activeGameRooms.add(activeGame);

    playerOneSocket.join(randomRoomName);
    playerTwoSocket.join(randomRoomName);

    initializePlayerSockets(playerOneSocket, playerTwoSocket);

    gameOverEmitter.on(GAME_OVER, activeGame => {
      activeGameRooms.delete(activeGame);
    });

    // received p1 move 
    playerOneSocket.on(PLAYER_ONE_STORAGE_KEY, (moveInfo) => {
      const { tileId, boardId } = moveInfo;
      activeGame.sendMove(tileId, boardId);
      console.log("Received move. tileid: " + tileId + " player two");
    });
    // received p2 move
    playerTwoSocket.on(PLAYER_TWO_STORAGE_KEY, (moveInfo) => {
      const { tileId, boardId } = moveInfo;
      activeGame.sendMove(tileId, boardId);
      console.log("Received move. tileid: " + tileId + " player one");
    });

    console.log("num active game rooms: " + activeGameRooms.size);
  }
});

function initializePlayerSockets(playerOneSocket, playerTwoSocket) {
  const playerOneInitializeData = {
    playerKey: PLAYER_ONE_STORAGE_KEY, playerSymbol: PLAYER_ONE_SYMBOL,
    opponentSymbol: PLAYER_TWO_SYMBOL
  };

  const playerTwoInitializeData = {
    playerKey: PLAYER_TWO_STORAGE_KEY, playerSymbol: PLAYER_TWO_SYMBOL,
    opponentSymbol: PLAYER_ONE_SYMBOL
  }

  console.log("p1 intial data: " + JSON.stringify(playerOneInitializeData));
  console.log("p2 initial data: " + JSON.stringify(playerTwoInitializeData));

  playerOneSocket.emit(INITIALIZE, playerOneInitializeData);
  playerTwoSocket.emit(INITIALIZE, playerTwoInitializeData);
}

server.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

// app.get("/", function (req, res) {
//     res.sendFile(__dirname + "/index.html");
// });

app.get("/rooms", function (req, res) {
  printClientInRooms().then(clientInRooms => {
    if (clientInRooms === "") {
      console.log("/rooms, no rooms ");
      clientInRooms = "/rooms no rooms. Room queues: " + activeGameRooms.length;
    } else {
      console.log("/rooms: " + clientInRooms);
    }
    res.send(clientInRooms);
  });
})

async function printClientInRooms() {
  let clientInRoomsStr = "";
  for (const roomName of activeGameRooms) {
    const sockets = await io.in(roomName).fetchSockets();
    for (const socket of sockets) {
      clientInRoomsStr += "\n Socket in room: " + roomName + ". socket id: " + socket.id;
      console.log("Socket in room: " + roomName + ". socket id: " + socket.id);
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