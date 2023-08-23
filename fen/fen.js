var stockfish = new Worker('stockfish.js');
wer ="";
FEN="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
var init = function() {

var onChange = function (oldPos, newPos) {
	 
	// board.position();
	
  console.log("Position changed:");
  console.log("Old position: " + ChessBoard.objToFen(oldPos));
  console.log("New position: " + ChessBoard.objToFen(newPos));
  console.log("--------------------");
 
   FEN = ChessBoard.objToFen(newPos);
   
   //  document.getElementById('content').innerHTML = FEN;
   
   
    };

var onDrop = function(source, target, piece, newPos, oldPos, orientation) {
  console.log("Source: " + source);
  console.log("Target: " + target);
  console.log("Piece: " + piece);
  console.log("New position: " + ChessBoard.objToFen(newPos));
  console.log("Old position: " + ChessBoard.objToFen(oldPos));
  console.log("Orientation: " + orientation);
  console.log("--------------------");
  
  FEN = ChessBoard.objToFen(newPos);
  document.getElementById("myFen").value = FEN;   
  
    figur = piece.split(""); 
   farbe = figur[0]; 
   if (farbe  == "w"){wer = "w"}else {wer = "b"}
  
//   document.getElementById('content').innerHTML =  wer;

  
};

var cfg = {
  draggable: true,
  position: 'start',
  onDrop: onDrop,
  onChange: onChange,
  sparePieces: true
};
var board = ChessBoard('board', cfg);
//--- end example JS ---

$('#startPositionBtn').on('click', function() {
  board.position('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
  document.getElementById("myFen").value = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
  
});
$('#clearBoardBtn').on('click', function() {
  board.position('8/8/8/8/8/8/8/8');
  document.getElementById("myFen").value = '8/8/8/8/8/8/8/8';
  
});

$('#flipOrientationBtn').on('click', board.flip);


$('#move1Btn').on('click', function() {
	
if (wer == "w"){wer = "b"} else {wer = "w"}

stockfish.postMessage("position fen"+" "+FEN+" "+wer);
 stockfish.postMessage("go depth 15");
   stockfish.onmessage = function(event) {
  console.log(event.data);
  
  document.getElementById("ausgabe").value = event.data; 
  // document.getElementById("ausgabe2").innerHTML = event.data; 
   var str = event.data;
   var res = str.split(" "); 
   
   if (res[0] == "bestmove"){   
   
     var zug = res[1].split(""); 
   
     var bot = zug[0]+zug[1]+"-"+zug[2]+zug[3];
  //  document.getElementById("ausgabe3").innerHTML = bot; 
    
     board.move(bot);  
   
     FENzerlegung = FEN.split("/"); 

var FEN0 = FENzerlegung[0].replace("P","Q"); 
var FEN7 = FENzerlegung[7].replace("p","q"); 

 
 FEN=FEN0+"/"+FENzerlegung[1]+"/"+FENzerlegung[2]+"/"+FENzerlegung[3]+"/"+FENzerlegung[4]+"/"+FENzerlegung[5]+"/"+FENzerlegung[6]+"/"+FEN7;

board.position(FEN);


    }
};
});



}; // end init()
$(document).ready(init);


