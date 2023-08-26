const startPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'
const state = {
  select: 'highlight1', 
  moves: [], 
  color: 'w',
  play: 'play1'
}

function drawBoard(position = startPosition) {
  var area = create('div', {style: 'display: flex;flex-wrap: wrap;'})
  append(document.body, area)
  clearAll()
  append(area, addFenInput(position))
  append(area, addBoard(position))
  append(area, addSparePieces())
  append(area, addConsole())
  clearConsole()
}

function clearAll() {
  document.querySelectorAll('.board').forEach(el => el.remove())
  document.querySelectorAll('.spare').forEach(el => el.remove())
  document.querySelectorAll('.fen').forEach(el => el.remove())
  document.querySelector('#console')?.remove()
}

function addSparePieces() {
  const options = {
    style: `display: flex;flex-direction: column;`,
  }
  const div = create('div', {
    style: `display: flex;`,
	class: 'spare'
  })
  drawSparePieces(append(div, create('div', options)), 'b')
  drawSparePieces(append(div, create('div', options)), 'w')
  return div
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
function addBoard(position) {
  var board = create('div', {class: 'board'})
  fromFen(position)
    .forEach((r, i) => drawRow(board, r, 8 - i))
  return board
}

function drawRow(board, row, rowIndex) {
  var rowDiv = create('div', {class: 'row'})
  Array.from(row).forEach((c, i) => drawSquare(rowDiv, row, rowIndex, c, i))
  append(board, rowDiv)
  return rowDiv
}

function drawSquare(board, row, rowIndex, c, colIndex,
  cols = 'abcdefgh', 
  col = cols[colIndex]) {
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
  from.addEventListener('touchstart', handleStart, options)
  from.addEventListener('touchend', handleEnd, options)
  from.addEventListener('touchcancel', handleCancel, options)
  from.addEventListener('touchleave', handleLeave, options)
  from.addEventListener('touchmove', handleMove, options)
  return from
}
function handleStart(ev) {
  ev.stopPropagation()
  delete state.piece
  delete state.square
  state.piece = ev.target
  if (!state.piece.id) state.square = state.piece.parentElement
}
function handleEnd(ev) {
  ev.stopPropagation()
  deselectAll()
  var touch = ev.changedTouches[0]
  moveTo(getSquare(document.elementFromPoint(touch.clientX, touch.clientY)))
}
function handleCancel(ev) {}
function handleLeave(ev) {}
function handleMove(ev) {
  var touch = ev.changedTouches[0]
  var hover = getSquare(document.elementFromPoint(touch.clientX, touch.clientY))
  if (state.highlight == hover.dataset.square) return
  deselectAll()
  hover.classList.add(state.select)
  state.highlight = hover.dataset.square
}
//-----------------------------------

// ----------- drag drop -------------
function drag(ev) {
  delete state.piece
  delete state.square
  state.piece = ev.target
  if (!state.piece.id) state.square = state.piece.parentElement
}
function drop(ev) {
  ev.preventDefault()
  moveTo(getSquare(ev.target))
}
function allowDrop(ev) { ev.preventDefault() }
function withDraggable(el) {
  return {...el, draggable: true, ondragstart: 'drag(event)' }
}
function withDrop(el) {
  return {...el, ondrop: 'drop(event)', ondragover: 'allowDrop(event)' }
}
function getSquare(elm) {
  return elm.tagName.toLowerCase() == 'img' ? elm.parentElement : elm
}
function moveTo(target) {
  var fromSquare = state.square?.dataset.square
  var toSquare = target.dataset.square
  if (fromSquare == toSquare || !toSquare) return;
  movePieceOnBoard(state.piece, target, withTouchEvents(state.piece.cloneNode()))
  movePieceInFen(state.piece.dataset.piece, fromSquare, toSquare)
  if (!state.square) return
  removeAllChildren(state.square)
  state.moves.push(`${fromSquare}${toSquare}`)
}
function deselectAll() {
  Array.from(document.querySelectorAll(`.${state.select}`))
    .forEach(e => e.classList.remove(state.select))
}
// ----------------------------------

// --------------- fen -----------
function movePieceInFen(piece, fromSquare, toSquare) {
  if (fromSquare) updateFen(fromSquare, '  ')
  updateFen(toSquare, piece)
}
function switchSide() {
  state.color = {w: 'b', b: 'w'}[state.color]
  toggle = document.getElementById('toggle')
  fen = document.getElementById('fen')
  setColor(fen, {w: 'white', b: 'black'}[state.color])
  toggle.innerHTML = {b: '&#9818;', w: '&#9812;'}[state.color]
}
function addFenInput(position) {
  var div = create('div', {class: 'fen'})
  var fen = append(div, create('div', withContentEditable({
    style: 'font-family: monospace;font-size: 20px;width: 600px;',
    innerText: position, 
    id: 'fen'
  })))
  var options = {
    innerHTML: '&#9812;',
    style: 'font-size: 25px;',
	id: 'toggle'
  }
  append(div, create('button', options)).addEventListener('click', () => switchSide())
  append(div, create('button', {innerHTML: '&#10006;', style: 'font-size: 25px;'}))
    .addEventListener('click', () => {
      document.getElementById('fen').innerText = '8/8/8/8/8/8/8/8'
	  fenChanged()
    })
  append(div, create('button', {innerHTML: '&#128257;', style: 'font-size: 25px;'}))
    .addEventListener('click', () => {
      document.getElementById('fen').innerText = startPosition
	  fenChanged()
    })
  const playOptions = {style: 'font-size: 25px;', id: state.play}
  append(div, create('button', {innerHTML: '▶️', ...playOptions}))
    .addEventListener('click', () => bestmove(state.color))
  return div
}
function setColor(elm, bc) {
  elm.style.backgroundColor = bc
  elm.style.color = bc == 'white' ? 'black' : 'white'
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
setTimeout(() => takeOverConsole(), 1000)
function bestmove(color) {
  startWait()
  clearConsole()
  var fen = document.getElementById('fen').innerText
  stockfish.postMessage(`position fen ${fen} ${color}`)
  stockfish.postMessage("go depth 15")
  stockfish.onmessage = onmessage
}
function addConsole() {
  return create('div', {id: 'console'})
}
function onmessage(event) {
  if (!event.data.startsWith('bestmove')) return
  var lines = event.data.split(' ')
  var fromSquare = document.querySelector('.square-' + lines[1].substr(0,2))
  var toSquare = document.querySelector('.square-' + lines[1].substr(2))
  endWait()
  state.piece = fromSquare.querySelector('img')
  state.square = fromSquare
  moveTo(toSquare)
  switchSide()
}
function startWait() {
  document.body.style.cursor = 'progress'
  document.getElementById(state.play).disabled = true
}
function endWait() {
  document.body.style.cursor = 'default'
  document.getElementById(state.play).disabled = false
}
function clearConsole() {
  var cs = document.querySelector('#console')
  removeAllChildren(cs)
  console.log('\n')
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
  removeAllChildren(dest)
  clone.removeAttribute('id')
  dest.appendChild(clone)
}

function create(tag, attributes = {}) { 
  var element = document.createElement(tag)
  Object.keys(attributes)
    .forEach(key => {
      if (key == 'innerText')
        return element.innerText = attributes[key]
	  if (key == 'innerHTML')
        return element.innerHTML = attributes[key]
      element.setAttribute(key, attributes[key])
    })
  return element
}

function append(from, to) { 
  from.appendChild(to)
  return to
}

function removeAllChildren(from, child = from?.lastElementChild) {
  if (!child) return
  from.removeChild(child)
  removeAllChildren(from)
}

function setCharAt(str, index, chr) {
  if(index > str.length-1) return str
  return str.substring(0,index) + chr + str.substring(index+1)
}

function guid(base = [1e7]+-1e3+-4e3+-8e3+-1e11) {
  return base
    .replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4)
	  .toString(16))
}
