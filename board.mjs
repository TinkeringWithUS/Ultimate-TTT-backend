const DRAW = "DRAW";
const NUM_TILES = 9;

export class GameBoard {
    playerOne
    playerTwo
    endState
    tilesPlaced
    constructor(playerOne, playerTwo) {
        this.playerOne = playerOne;
        this.playerTwo = playerTwo;

        this.endState = null;
        this.tilesPlaced = 0;

        this.board = [];
        for (let i = 0; i < NUM_TILES; i++) {
            this.board.push(String(i));
        }
    }

    resetBoard() {
        for (let i = 0; i < NUM_TILES; i++) {
            this.board[i] = String(i);
        }
        this.tilesPlaced = 0;
        this.endState = null;
    }

    placeTile(tileId, player) {
        let selectedTile = this.board[tileId];
        let defaultTileOwner = tileId;

        // if trying to place tile on tile that already has owner, or
        // board has a winner, don't place tile. 
        if (selectedTile !== defaultTileOwner || this.endState !== null) {
            console.log("failed to place tile. winner: " + this.endState + " is enabled: " + this.isEnabled +
                " and owner: " + selectedTile.owner);
            return false;
        }

        this.tilesPlaced++;
        this.board[tileId] = player;
        this.endState = this.getWinner();
        console.log("board place tile. tile placed at: " + tileId + " and this.board[tileId]: " + this.board[tileId] + 
        " end state: " + this.endState);
        return true;
    }

    getWinner() {
        if (this.tilesPlaced === NUM_TILES) {
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
            let originalOwner = this.board[combo[0]];
            for (let comboIndex = 0; comboIndex < combo.length; comboIndex++) {
                let currentOwner = this.board[combo[comboIndex]];
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

    getBoardString() {
        let boardString = "";
        const NUM_ROWS = 3;
        for(let row = 0; row < NUM_ROWS; row++) {
            for(let col = 0; col < NUM_ROWS; col++) {
                boardString += this.board[row * NUM_ROWS + col] + " ";
            }
            boardString += "\n";
        }
        return boardString;
    }
}