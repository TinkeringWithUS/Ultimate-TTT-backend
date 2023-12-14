import { GameBoard } from "./board.mjs";

const NUM_BOARDS = 9;
const DRAW = "D";

export class MetaBoard {
  constructor(playerOne, playerTwo) {
    this.playerOne = playerOne;
    this.playerTwo = playerTwo;

    this.gameState = null;

    this.nextBoardToPlay = -1;
    this.boardsInPlay = NUM_BOARDS;

    this.metaGameState = [];
    for (let i = 0; i < NUM_BOARDS; i++) {
      this.metaGameState.push({
        id: String(i),
        status: null,
        enabled: true,
        board: new GameBoard(),
      });
    }
  }

  placeTile(tileId, boardId, player) {
    const selectedBoardState = this.metaGameState[boardId];
    if (!selectedBoardState.enabled || this.gameState !== null ||
      !selectedBoardState.board.placeTile(tileId, player)) {
      // console.log("metaboard. place tile failed. selectedboard enabled: " + selectedBoardState.enabled +
      //     " and game state: " + this.gameState);
      return false;
    }
    // console.log("place tile in metaboard has passed falsy. player: " + player + "tileId: " + tileId);
    selectedBoardState.status = selectedBoardState.board.endState;
    this.nextBoardToPlay = tileId;

    if (selectedBoardState.status !== null) {
      this.boardsInPlay--;
    }

    // bug, if board[0].winner !== null, and nextBoard == board[0], then 
    // enable status will be all, but then the next move won't appear

    const nextBoard = this.metaGameState[this.nextBoardToPlay];
    const endGameStates = [this.playerOne, this.playerTwo, DRAW];
    if (endGameStates.includes(nextBoard.status)) {
      this.nextBoardToPlay = -1;
      this.setAllEnableBoardStatus(true);
    } else {
      this.setAllEnableBoardStatus(false);
      this.metaGameState[tileId].enabled = true;
    }

    this.gameState = this.getWinner();
    return true;
  }

  getWinner() {
    if (this.boardsInPlay === 0) {
      return DRAW;
    }

    // algorithm only works if every tile id isn't all the same, that's
    // why this breaks when all tile owners are "" or equivalent. Easy plan,
    // number them under the hood, but don't show the players the coordinates
    let winningCombinations = [
      [0, 1, 2], // row wins
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6], // column wins
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8], // diagonal wins
      [2, 4, 6]
    ];

    for (const combo of winningCombinations) {
      let isWinning = false;
      let originalOwner = this.metaGameState[combo[0]].status;
      for (let comboIndex = 0; comboIndex < combo.length; comboIndex++) {
        let currentOwner = this.metaGameState[combo[comboIndex]].status;
        isWinning = currentOwner === originalOwner;
        if (!isWinning) {
          break;
        }
      }
      if (isWinning) {
        return originalOwner;
      }
    }
    return null;
  }

  resetMetaBoard() {
    for (const boardState of this.metaGameState) {
      boardState.status = null;
      boardState.enabled = true;
      boardState.board.resetBoard();
    }
    this.boardsInPlay = NUM_BOARDS;
    this.nextBoardToPlay = -1;
    this.playerOneTurn = true;
    this.gameState = null;
  }

  setAllEnableBoardStatus(enableStatus) {
    for (const boardState of this.metaGameState) {
      boardState.enabled = enableStatus;
    }
  }

  getMetaBoardString() {
    const NUM_ROWS = 3;
    let metaBoardString = "";

    for (let row = 0; row < NUM_ROWS; row++) {
      for (let col = 0; col < NUM_ROWS; col++) {
        let boardPos = row * NUM_ROWS + col;
        if (this.metaGameState[boardPos].enabled) {
          metaBoardString += this.metaGameState[row * NUM_ROWS + col].board.getBoardString();
        } else {
          for (let space = 0; space < NUM_ROWS * NUM_ROWS; space++) {
            metaBoardString += "N";
            if (space % NUM_ROWS == 0) {
              metaBoardString += "\n";
            }
          }
        }
      }
      metaBoardString += "\n\n";
    }
    return metaBoardString;
  }
}
