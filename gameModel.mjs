import {
    DRAW, NEW_MOVE, PLAYER_ONE_STORAGE_KEY, PLAYER_TWO_STORAGE_KEY, LOSER, WINNER, GAME_OVER
    // RESET, WAIT_FOR_OTHER_PLAYER, RESETTED 
}
    from "../utils/constants.mjs";
import { MetaBoard } from "./metaBoard.mjs";

export class GameModel {

    constructor(playerOne, playerTwo, playerOneSocket, playerTwoSocket, gameRoom, gameOverEmitter) {
        this.playerOne = playerOne;
        this.playerTwo = playerTwo;

        this.playerOneSocket = playerOneSocket;
        this.playerTwoSocket = playerTwoSocket;

        this.gameId = gameId;
        this.gameRoom = gameRoom;
        this.gameOverEmitter = gameOverEmitter;

        this.playerOnePlayAgain = false;
        this.playerTwoPlayAgain = false;

        this.playerOneTurn = true;
        this.metaBoard = new MetaBoard(this.playerOne, this.playerTwo);
        this.endStatus = null;
    }

    placeTile(tileId, boardId) {
        const tileOwner = this.playerOneTurn ? this.playerOne : this.playerTwo;
        let hasPlaced = this.metaBoard.placeTile(tileId, boardId, tileOwner);
        if (!hasPlaced) {
            // console.log("place tile in game model failed. has place === false");
            return false;
        }
        this.endStatus = this.metaBoard.getWinner();
        if (this.endStatus !== null) {
            this.sendGameOver();
        }
        return true;
    }

    sendMove(tileId, boardId) {
        const hasPlaced = this.placeTile(tileId, boardId);

        if (hasPlaced) {
            const moveSenderPlayerSocket = this.playerOneTurn ? this.playerOneSocket : this.playerTwoSocket;
            const receivingPlayerKey = this.playerOneTurn ? PLAYER_TWO_STORAGE_KEY : PLAYER_ONE_STORAGE_KEY;
            const newMoveInfo = {
                moveId: tileId, boardId: boardId, gameStatus: this.endStatus, player: receivingPlayerKey
            };

            moveSenderPlayerSocket.to(this.gameRoom).emit(NEW_MOVE, newMoveInfo);

            console.log("server sending move. receiving player: " + receivingPlayerKey + ". tileid: " + tileId);

            this.playerOneTurn = !this.playerOneTurn;
        }

        this.printModel();
    }

    sendGameOver() {
        const metaBoardEndState = this.metaBoard.getWinner();

        if (metaBoardEndState === this.playerOne) {
            this.playerOneSocket.emit(WINNER);
            this.playerTwoSocket.emit(LOSER);
            console.log("p1 has won");
        } else if (metaBoardEndState === this.playerTwo) {
            this.playerOneSocket.emit(LOSER);
            this.playerTwoSocket.emit(WINNER);
            console.log("p2 has won");
        } else { // we have a draw
            this.playerOneSocket.emit(DRAW);
            this.playerTwoSocket.emit(DRAW);
            console.log("draw");
        }
        this.gameOverEmitter.emit(GAME_OVER, this);
    }

    // registerPlayAgainListeners() {
    //     this.playerOneSocket.on(RESET, () => {
    //         this.playerOnePlayAgain = true;

    //         if(!this.playerTwoPlayAgain) {
    //             this.playerOneSocket.emit(WAIT_FOR_OTHER_PLAYER);
    //         }
    //     });

    //     this.playerTwoSocket.on(RESET, () => {
    //         this.playerTwoPlayAgain = true;

    //         if(!this.playerOnePlayAgain) {
    //             this.playerTwoSocket.emit(WAIT_FOR_OTHER_PLAYER);
    //         }
    //     });

    //     if(this.playerOnePlayAgain && this.playerTwoPlayAgain) {
    //         this.metaBoard.resetMetaBoard();
    //         this.playerOneSocket.emit(RESETTED);
    //         this.playerTwoSocket.emit(RESETTED);
    //     }

    // }

    getEndState() {
        return this.endStatus;
    }

    printModel() {
        const metaBoardStr = this.metaBoard.getMetaBoardString();
        console.log("Meta Board \n\n" + metaBoardStr);
    }
}
