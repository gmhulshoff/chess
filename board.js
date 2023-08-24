const startPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'
const state = {}

function drawBoard(position = startPosition) {
  clearAll()
  addFenInput()
  addBoard(position)
  addSparePieces()
}

function clearAll() {
  document.querySelectorAll('.board').forEach(el => el.remove())
  document.querySelectorAll('.spare').forEach(el => el.remove())
  document.querySelector('#fen')?.remove()
}

function addBoard(position) {
  var board = create('div', {class: 'board'})
  append(document.body, board)
  fromFen(position)
    .forEach((r, i) => drawRow(board, r, 8 - i))
}

function addSparePieces() {
  drawSparePieces(append(document.body, create('div', {
    style: `display: flex;`
  })), 'b')
  drawSparePieces(append(document.body, create('div', {
    style: `display: flex;`
  })), 'w')
}

function drawSparePieces(div, color) {
  Array
    .from('KQRBNP')
	.forEach(pc => append(div, withTouchEvents(create('img', withDraggable({
      src:`./fen/${color}${pc}.png`, 
      'data-piece':`${color}${pc}`, 
      class: 'piece spare',
	  id: `${color}${pc}`
    })))))
}

// ------------------ Drawboard ------------------
function drawRow(board, row, rowIndex) {
  var rowDiv = create('div', {class: 'row'})
  Array.from(row).forEach((c, i) => drawSquare(rowDiv, row, rowIndex, c, i))
  append(board, rowDiv)
  return rowDiv
}

function drawSquare(board, row, rowIndex, c, colIndex, cols = 'abcdefgh', col = cols[colIndex]) {
  var color = rowIndex%2 == 0 
    ? colIndex%2 == 0 ? 'white' : 'black' 
	: {white: 'black', black: 'white'}[colIndex%2 == 0 ? 'white' : 'black']
  var square = create('div', withDrop({
    class: `square ${color} square-${col}${rowIndex}`, 
    'data-square': `${col}${rowIndex}`
  }))
  if (colIndex == 0) addNotation(square, 'numeric', `${rowIndex}`)
  if (rowIndex == 1) addNotation(square, 'alpha', `${col}`)
  drawPiece(square, c)
  append(board, square)
  return square
}

function drawPiece(square, piece) {
  if (piece == ' ') return
  var pieceUpper = piece.toUpperCase()
  var pc = `${pieceUpper == piece ? 'w' : 'b'}${pieceUpper}`
  var img = withTouchEvents(create('img', withDraggable({
    alt:piece, 
    src: `./fen/${pc}.png`,
    class: 'piece', 
    'data-piece': pc
  })))
  append(square, img)
}

function addNotation(square, cls, text) {
  var notation = create('div', {
    class: `notation ${cls}`, 
    innerText: text
  })
  append(square, notation)
}
// -----------------------------------------------


// ----------- touch events ----------
function withTouchEvents(from) {
  from.addEventListener('touchstart', handleStart, { passive: true} )
  from.addEventListener('touchend', handleEnd, { passive: true} )
  from.addEventListener('touchcancel', handleCancel, { passive: true} )
  from.addEventListener('touchleave', handleLeave, { passive: true} )
  from.addEventListener('touchmove', handleMove, { passive: true} )
  return from
}
function handleStart(ev) {
  console.log({handleStart: ev})
  var square = ev.target.tagName.toLowerCase() == 'img'
    ? ev.target.parentElement
	: ev.target
  state.from = ev.target
  if (!ev.target.id) state.square = square
}
function handleEnd(ev) {
  console.log({handleEnd: ev})
  var touch = ev.changedTouches[0]
  var dropSquare = document.elementFromPoint(touch.clientX, touch.clientY)
  if (dropSquare.tagName.toLowerCase() == 'img')
    dropSquare = dropSquare.parentElement
  removeAllChildren(dropSquare)
  var clone = withTouchEvents(state.from.cloneNode())
  clone.removeAttribute('id')
  dropSquare.appendChild(clone)

  movePiece(
    clone.dataset.piece, 
	state.from.parentElement.dataset.square, 
	dropSquare.dataset.square)
  if (state.square) removeAllChildren(state.square)
}
function handleCancel(ev) {
}
function handleLeave(ev) {
}
function handleMove(ev) {
}
//-----------------------------------

// ----------- drag drop -------------
function drag(ev) { 
  if (!ev.target.id) ev.target.id = 'boardPiece'
  ev.dataTransfer.setData('id', ev.target.id)
}
function drop(ev) {
  ev.preventDefault()
  var dropTarget = ev.target.tagName.toLowerCase() == 'img'
    ? ev.target.parentElement
	: ev.target
  removeAllChildren(dropTarget)
  var data = ev.dataTransfer.getData('id')
  var spare = document.getElementById(data)
  var clone = spare.cloneNode()
  clone.removeAttribute('id')
  dropTarget.appendChild(clone)
  var piece = clone.dataset.piece
  var square = dropTarget.dataset.square
  var fromSquare = spare.parentElement.dataset.square
  movePiece(piece, fromSquare, square)
  if (fromSquare) removeAllChildren(spare.parentElement)
}
function allowDrop(ev) { ev.preventDefault() }
function withDraggable(el) {
  return {...el, draggable: true, ondragstart: 'drag(event)' }
}
function withDrop(el) {
  return {...el, ondrop: 'drop(event)', ondragover: 'allowDrop(event)' }
}
// ----------------------------------

// --------------- fen -----------
function movePiece(piece, fromSquare, square) {
  if (fromSquare) updateFen(fromSquare, '  ')
  updateFen(square, piece)
}
function addFenInput() {
  append(document.body, create('div', withContentEditable({
	style: 'font-family: monospace;font-size: 24px;',
    innerText: startPosition, 
    id: 'fen'
  })))
}
function withContentEditable(el) {
  return {...el, contenteditable: true, onblur: 'fenChanged(event)' }
}
function fenChanged(ev) {
  var src = document.getElementById('fen')
  if (!fenOk(src.innerText)) return src.innerText = startPosition
  drawBoard(src.innerText)
}
function fenOk(fen) {
  return fromFen(fen)
    .reduce((a, c) => a && c.length == 8 && !c.match(/[^rnbqkpRNBQKP ]/), true)
}
function updateFen(square, piece) {
  var fen = document.getElementById('fen')
  var rows = fromFen(fen.innerText)
  var rowIndex = 8 - square[1]
  var colIndex = square.charCodeAt(0) - 'a'.charCodeAt(0)
  var pc = piece[0] == 'b' ? piece[1].toLowerCase() : piece[1]
  rows[rowIndex] = setCharAt(rows[rowIndex], colIndex, pc)
  fen.innerText = toFen(rows).replace(/ /g, '1')
}
function fromFen(fen) {
  return fen.split('/')
    .map(r => Array
	  .from(r)
	  .reduce((a, c) => `${a}${isNaN(c) ? c : ' '.repeat(c)}`, ''))
}
function toFen(rows) {
  return rows.map(r => compressSpaces(r)).join('/')
}
function compressSpaces(r, n = 8) {
  if (n == 0) return r
  return compressSpaces(r.replaceAll(' '.repeat(n), `${n}`), n - 1)
}
// --------------------------------

function create(tag, attributes = {}) { 
  var element = document.createElement(tag)
  Object.keys(attributes)
    .filter(key => key != 'innerText')
    .forEach(key => element.setAttribute(key, attributes[key]))
  Object.keys(attributes)
    .filter(key => key == 'innerText')
	.forEach(key => element.innerText = attributes[key])
  return element
}

function append(from, to) { 
  from.appendChild(to)
  return to
}

function removeAllChildren(from, child = from.lastElementChild) {
  if (!child) return
  from.removeChild(child)
  removeAllChildren(from)
}

function setCharAt(str, index, chr) {
  if(index > str.length-1) return str
  return str.substring(0,index) + chr + str.substring(index+1)
}
