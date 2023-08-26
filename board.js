const startPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'
const state = {select: 'highlight1'}

function drawBoard(position = startPosition) {
  var area = create('div')
  append(document.body, area)
  clearAll()
  addFenInput(area, position)
  addBoard(area, position)
  addSparePieces(area)
  addConsole(area)
}

function clearAll() {
  document.querySelectorAll('.board').forEach(el => el.remove())
  document.querySelectorAll('.spare').forEach(el => el.remove())
  document.querySelector('#console')?.remove()
  document.querySelector('#fen')?.remove()
}

function addBoard(area, position) {
  var board = create('div', {class: 'board'})
  append(area, board)
  fromFen(position)
    .forEach((r, i) => drawRow(board, r, 8 - i))
  return board
}

function addSparePieces(area) {
  const options = {
    style: `display: flex;flex-direction: column`,
  }
  const div = append(area, create('div', {
    style: `display: flex;`,
	class: 'spare'
  }))
  drawSparePieces(append(div, create('div', options)), 'b')
  drawSparePieces(append(div, create('div', options)), 'w')
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
  from.setAttribute('style', 'touch-action: none;')
  const options = { passive: true }
  from.addEventListener('touchstart', handleStart, options )
  from.addEventListener('touchend', handleEnd, options )
  from.addEventListener('touchcancel', handleCancel, options )
  from.addEventListener('touchleave', handleLeave, options )
  from.addEventListener('touchmove', handleMove, options )
  return from
}
function handleStart(ev) {
  ev.stopPropagation()
  var square = ev.target.tagName.toLowerCase() == 'img'
    ? ev.target.parentElement
    : ev.target
  state.from = ev.target
  if (!ev.target.id) state.square = square
}
function handleEnd(ev) {
  deselectAll()
  ev.stopPropagation()
  var touch = ev.changedTouches[0]
  var dropSquare = document.elementFromPoint(touch.clientX, touch.clientY)
  if (dropSquare.tagName.toLowerCase() == 'img')
    dropSquare = dropSquare.parentElement
  var square = state.from.parentElement.dataset.square
  var toSquare = dropSquare.dataset.square
  if (square == toSquare || !toSquare) return;
  removeAllChildren(dropSquare)
  movePieceOnBoard(state.from, dropSquare, withTouchEvents(state.from.cloneNode()))
  movePieceInFen(state.from.dataset.piece, square, toSquare)
  if (state.square) removeAllChildren(state.square)
  delete state.square
}
function handleCancel(ev) {}
function handleLeave(ev) {}
function handleMove(ev) {
  var touch = ev.changedTouches[0]
  var hover = document.elementFromPoint(touch.clientX, touch.clientY)
  if (hover.tagName.toLowerCase() == 'img')
    hover = hover.parentElement
  if (state.highlight == hover.dataset.square) return
  deselectAll()
  hover.classList.add(state.select)
  state.highlight = hover.dataset.square
}

function deselectAll() {
  Array.from(document.querySelectorAll(`.${state.select}`))
    .forEach(e => e.classList.remove(state.select))
}
//-----------------------------------

// ----------- drag drop -------------
function drag(ev) { 1
  if (!ev.target.id) ev.target.id = 'boardPiece'
  ev.dataTransfer.setData('id', ev.target.id)
}
function drop(ev) {
  ev.preventDefault()
  var dropTarget = ev.target.tagName.toLowerCase() == 'img'
    ? ev.target.parentElement
    : ev.target
  var data = ev.dataTransfer.getData('id')
  var spare = document.getElementById(data)
  var square = dropTarget.dataset.square
  var fromSquare = spare.parentElement.dataset.square
  if (square == fromSquare) return
  removeAllChildren(dropTarget)
  movePieceOnBoard(spare, dropTarget)
  var piece = spare.dataset.piece
  movePieceInFen(piece, fromSquare, square)
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
function movePieceInFen(piece, fromSquare, square) {
  if (fromSquare) updateFen(fromSquare, '  ')
  updateFen(square, piece)
}
function addFenInput(area, position) {
  append(area, create('div', withContentEditable({
    style: 'font-family: monospace;font-size: 20px;width: 480px',
    innerText: position, 
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

// ------------ Stockfish ---------
const stockfish = new Worker('fen/stockfish.js')
setTimeout(() => {
  takeOverConsole()
  //bestmove(startPosition, 'w')
},1000)
function bestmove(fen, color) {
  clearConsole()
  stockfish.postMessage(`position fen ${fen} ${color}`)
  stockfish.postMessage("go depth 15")
  stockfish.onmessage = onmessage
}
function addConsole(board) {
  var cs = create('div', {id: 'console'})
  append(board, cs)
}
function onmessage(event) {
  console.log(event.data)
}
function clearConsole() {
  var cs = document.querySelector('#console')
  removeAllChildren(cs)
  console.log('\n\n\n\n\n\n')
}
function log(line) {
  var cs = document.querySelector('#console')
  append(cs, create('pre', {innerText: line}))
}
function takeOverConsole() {
  var console = window.console
  function intercept(method) {
    var original = console[method]
    console[method] = function() {
      var message = Array.prototype.slice.apply(arguments).join(' ')
      original.call(console, message)
	  log(message)
    }
  }
  ['log', 'warn', 'error']
    .forEach(m => intercept(m))
}

// --------------------------------

function movePieceOnBoard(src, dest, clone = src.cloneNode()) {
  clone.removeAttribute('id')
  dest.appendChild(clone)
}

function create(tag, attributes = {}) { 
  var element = document.createElement(tag)
  Object.keys(attributes)
    .forEach(key => {
      if (key == 'innerText')
        return element.innerText = attributes[key]
      element.setAttribute(key, attributes[key])
    })
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
