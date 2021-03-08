import addGlobalEventListener from './utils/addGlobalEventListener.js'

export default function setup(onDragComplete) {
  addGlobalEventListener('mousedown', '[data-draggable]', (e) => {
    const root = document.documentElement
    root.style.setProperty('--grab', 'grabbing')

    const selectedItem = e.target
    const itemClone = selectedItem.cloneNode(true)
    const ghost = selectedItem.cloneNode(true)
    const originalLane = selectedItem.closest('[data-drop-zone]')
    const offset = setupDragItems(selectedItem, itemClone, ghost, e)

    setupDragEvents({
      selectedItem,
      itemClone,
      ghost,
      offset,
      originalLane,
      onDragComplete
    })
  })
}

/**
 * 拖曳和放開
 * @param {Object} 永Object包凱
 * @param {Element} selectedItem 選取的物件
 * @param {Element} itemClone selectedItem的複製品，拿來做拖曳殘影
 * @param {Element} ghost selectedItem的複製品，拿來看selectedItem要移動到哪裡
 * @param {Object} offset 滑鼠點擊時對物件left和top的相對距離
 * @param {Element} originalLane selectedItem原本的欄位
 * @param {Function} onDragComplete script.js要資訊用的
 */
function setupDragEvents({
  selectedItem,
  itemClone,
  ghost,
  offset,
  originalLane,
  onDragComplete
}) {
  const mousemoveFunction = (e) => {
    positionClone(itemClone, e, offset)
    const dropZone = e.target.closest('[data-drop-zone]')

    if (dropZone == null) return
    const closestChild = [...dropZone.children].find((child) => {
      const rect = child.getBoundingClientRect()
      return e.clientY < rect.top + rect.height / 2
    })

    if (closestChild) {
      dropZone.insertBefore(ghost, closestChild)
    } else {
      dropZone.appendChild(ghost)
    }
  }

  document.addEventListener('mousemove', mousemoveFunction)

  document.addEventListener(
    'mouseup',
    (e) => {
      const root = document.documentElement
      root.style.setProperty('--grab', 'initial')

      document.removeEventListener('mousemove', mousemoveFunction)
      const ghostZone = ghost.closest('[data-drop-zone]')

      ghostZone.insertBefore(selectedItem, ghost)
      onDragComplete({
        startZone: originalLane,
        endZone: ghostZone,
        dragElement: selectedItem,
        index: [...ghostZone.children].indexOf(selectedItem)
      })

      stopDrag(itemClone, ghost)
    },
    { once: true }
  )
  // 只執行一次，不然物件會疊加，每次滑鼠放掉時，前面點過的物件都會再次被移動
}

/**
 * 把拿來做拖曳效果的物件移除
 * @param {Element} itemClone
 * @param {Element} ghost
 */
function stopDrag(itemClone, ghost) {
  itemClone.remove()
  ghost.remove()
}

/**
 * 拖曳效果
 * @param {Element} selectedItem
 * @param {Element} itemClone
 * @param {Element} ghost
 * @param {Event} e
 * @returns {Object} offset
 */
function setupDragItems(selectedItem, itemClone, ghost, e) {
  const originalRect = selectedItem.getBoundingClientRect()

  // 滑鼠跟物件左邊和上方的距離
  const offset = {
    x: e.clientX - originalRect.left,
    y: e.clientY - originalRect.top
  }

  itemClone.classList.add('dragging')
  // 因為dragging class的position: absolute所以要把寬度設回去
  itemClone.style.width = `${originalRect.width}px`
  document.body.append(itemClone)
  positionClone(itemClone, e, offset)

  ghost.classList.add('ghost')
  ghost.innerHTML = ''
  // 去掉內容後把高度加回去才不會扁扁的
  ghost.style.height = `${originalRect.height}px`

  selectedItem.parentElement.insertBefore(ghost, selectedItem)
  selectedItem.remove()

  return offset
}

/**
 * 定位被選取的物件位置
 * @param {Element} itemClone
 * @param {Event} event
 * @param {Object} offset 滑鼠點擊時對物件left和top的相對距離
 */
function positionClone(itemClone, event, offset) {
  itemClone.style.top = `${event.clientY - offset.y}px`
  itemClone.style.left = `${event.clientX - offset.x}px`
}
