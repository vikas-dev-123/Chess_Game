const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
   const board = chess.board();
   boardElement.innerHTML = "";
   board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
       const squareElement = document.createElement("div");
       squareElement.classList.add(
        "square", 
        (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
       );

       squareElement.dataset.row = rowIndex;
       squareElement.dataset.col = squareIndex;

       if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
            "piece", 
            square.color === 'w' ? "white" : "black"
        );
        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
             if (pieceElement.draggable) {
                draggedPiece = pieceElement;
                sourceSquare = { row: rowIndex, col: squareIndex };
                e.dataTransfer.setData("text/plain", "");
             }
        });

        pieceElement.addEventListener("dragend", () => {
            draggedPiece = null;
            sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
       }

       squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
       });

       squareElement.addEventListener("drop", (e) => {
         e.preventDefault();
         if (draggedPiece) {
            const targetSquare = {
                row: parseInt(squareElement.dataset.row),
                col: parseInt(squareElement.dataset.col),
            };

            handleMove(sourceSquare, targetSquare);
         }
       });

       boardElement.appendChild(squareElement);
    });
   });

   if(playerRole === 'b'){
    boardElement.classList.add("flipped");
   }else{
    boardElement.classList.remove("flipped");

   }
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q' // Always promote to queen for simplicity
    };

    if (chess.move(move)) {
        socket.emit("move", move);
        chess.undo(); // Revert move for now, will be applied on server confirmation
    } else {
        console.error("Invalid move");
    }
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        k: "♔",
        q: "♕", 
        r: "♖",
        b: "♗", 
        n: "♘",  
        p: "♙",
        K: "♚",
        Q: "♛", 
        R: "♜",
        B: "♝", 
        N: "♞", 
        P: "♟", 
    };

    return unicodePieces[piece.type] || "";
};

socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

renderBoard();
