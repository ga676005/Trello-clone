import addGlobalEventListener from './utils/addGlobalEventListener.js'

export default function setup() {
  addGlobalEventListener('mousedown', '[data-draggable]', e => {
    const selectedItem = e.target
    const itemClone = selectedItem.cloneNode(true)
    const originalLane = selectedItem.closest('.tasks')
    const offset = setupDragItems(selectedItem, itemClone, e)

    setupDragEvents(selectedItem, itemClone, offset, originalLane)

  })
}

function setupDragEvents(selectedItem, itemClone, offset, originalLane) {
  const mousemoveFunction = (e) => {
    positionClone(itemClone, e, offset)
  }

  document.addEventListener('mousemove', mousemoveFunction)

  document.addEventListener('mouseup', (e) => {
    document.removeEventListener('mousemove', mousemoveFunction)
    itemClone.remove()

    if (e.target.closest('.tasks')) {
      e.target.closest('.tasks').appendChild(selectedItem)
    } else {
      originalLane.appendChild(selectedItem)
    }

  }, { once: true })
}

function setupDragItems(selectedItem, itemClone, e) {
  const originalRect = selectedItem.getBoundingClientRect()

  // 滑鼠跟物件的相對位置
  const offset = {
    x: e.clientX - originalRect.left,
    y: e.clientY - originalRect.top
  }

  selectedItem.remove()

  itemClone.classList.add('dragging')

  // 因為dragging class的position: absolute所以要把寬度設回去
  itemClone.style.width = `${originalRect.width}px`
  document.body.append(itemClone)
  positionClone(itemClone, e, offset)

  return offset
}

function positionClone(itemClone, event, offset) {
  itemClone.style.top = `${event.clientY - offset.y}px`
  itemClone.style.left = `${event.clientX - offset.x}px`
}