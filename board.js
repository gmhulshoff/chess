const startPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'

function drawBoard() {
  document.querySelectorAll('.board').forEach(el => el.remove())
  document.querySelectorAll('.spare').forEach(el => el.remove())

  var fen = document.querySelector('#fen')
  var pos = fen?.innerText || startPosition
  var rows = fromFen(pos)
  fen?.remove()

  append(document.body, create('div', {
    innerText: pos, 
    contenteditable: true,
    id: 'fen',
    oninput: 'fenChanging(event)',
    onblur: 'fenChanged(event)'
  }))
  var board = create('div', {class: 'board'})
  append(document.body, board)
  rows.forEach((r, i) => drawRow(board, r, 8 - i))
  drawSparePieces(append(document.body, create('div', {style: `display: flex;`})), 'b')
  drawSparePieces(append(document.body, create('div', {style: `display: flex;`})), 'w')
}

function drawSparePieces(div, color) {
  Array
    .from('KQRBNP')
	.forEach(pc => append(div, create('img', {
      src:`./fen/${color}${pc}.png`, 
      'data-piece':`${color}${pc}`, 
      class: 'piece spare',
	  id: `${color}${pc}`,
      draggable: true, 
      ondragstart: 'drag(event)'
    })))
}

function drawRow(board, row, rowIndex) {
  var rowDiv = create('div', {class: 'row'})
  Array.from(row).forEach((c, i) => drawSquare(rowDiv, row, rowIndex, c, i))
  append(board, rowDiv)
  return rowDiv
}

function drawSquare(board, row, rowIndex, c, colIndex, cols = 'abcdefgh', col = cols[colIndex]) {
  var c1 = colIndex%2 == 0 ? 'white' : 'black'
  var reverse = {white: 'black', black: 'white'}
  var color = rowIndex%2 == 0 ? c1 : reverse[c1]
  var square = create('div', {
    class: `square ${color} square-${col}${rowIndex}`, 
    'data-square': `${col}${rowIndex}`,
	ondrop: 'drop(event)',
	ondragover: 'allowDrop(event)'
  })
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
  var img = create('img', {
    alt:piece, 
    src: `./fen/${pc}.png`,
    class: 'piece', 
    'data-piece': pc,
    draggable: true, 
    ondragstart: 'drag(event)'
  })
  append(square, img)
}

function addNotation(square, cls, text) {
  var notation = create('div', {
    class: `notation ${cls}`, 
    innerText: text
  })
  append(square, notation)
}

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

// ----------- drag drop -------------
function drag(ev) { 
  if (!ev.target.id) ev.target.id = 'boardPiece'
  ev.dataTransfer.setData('id', ev.target.id
  )
}
function drop(ev) {
  ev.preventDefault()
  var dropTarget = ev.target.tagName.toLowerCase() == 'img' ? ev.target.parentElement : ev.target
  removeAllChildren(dropTarget)
  var data = ev.dataTransfer.getData('id')
  var spare = document.getElementById(data)
  var clone = spare.cloneNode()
  clone.removeAttribute('id')
  dropTarget.appendChild(clone)
  if (spare.id != 'boardPiece') return updateFen(dropTarget.dataset.square, clone.dataset.piece)
  updateFen(spare.parentElement.dataset.square, '  ')
  updateFen(dropTarget.dataset.square, clone.dataset.piece)
  removeAllChildren(spare.parentElement)
}
function allowDrop(ev) { ev.preventDefault() }
// ----------------------------------

// --------------- fen -----------
function fenChanged(ev) {
  var src = document.getElementById('fen')
  if (!fenOk(src.innerText)) return src.innerText = startPosition
  drawBoard(src.innerText)
}
function fenChanging(ev) { }
function fenOk(fen) {
  var rows = fromFen(fen)
  return rows.reduce((a, c) => a && c.length == 8 && !c.match(/[^rnbqkpRNBQKP ]/), true)
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
    .map(r => Array.from(r).reduce((a, c) => `${a}${isNaN(c) ? c : ' '.repeat(c)}`, ''))
}
function toFen(rows) {
  return rows.map(r => compressSpaces(r)).join('/')
}
function compressSpaces(r, n = 8) {
  if (n == 0) return r
  return compressSpaces(r.replaceAll(' '.repeat(n), `${n}`), n - 1)
}
// --------------------------------

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
  if(index > str.length-1) return str;
  return str.substring(0,index) + chr + str.substring(index+1);
}
