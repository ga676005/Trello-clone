import addGlobalEventListener from './utils/addGlobalEventListener.js'

const DEFAULT_SPACING = 15
const POSITION_ORDER = [
  'topRight',
  'topLeft',
  'bottomLeft',
  'bottomRight',
  'top',
  'bottom',
  'left',
  'right'
]
const POSITION_TO_FUNCTION_MAP = {
  bottomLeft: positionTooltipBottomLeft,
  bottomRight: positionTooltipBottomRight,
  topLeft: positionTooltipTopLeft,
  topRight: positionTooltipTopRight,
  top: positionTooltipTop,
  bottom: positionTooltipBottom,
  left: positionTooltipLeft,
  right: positionTooltipRight
}
const ARROW_STYLE = '4px solid rebeccapurple'

//定位tooltip用的container
const tooltipContainer = document.createElement('div')
tooltipContainer.classList.add('tooltip-container')
document.body.append(tooltipContainer)

addGlobalEventListener('mouseover', '[data-tooltip]', (e) => {
  if (e.target.dataset.tooltip.trim() === '') return
  tooltipContainer.innerHTML = ''

  const tooltip = createTooltipElement(e.target.dataset.tooltip)
  tooltipContainer.append(tooltip)
  //tooltip要先加到頁面上才能定位
  positionTooltip(tooltip, e.target)

  e.target.addEventListener(
    'mouseleave',
    () => {
      tooltip.remove()
    },
    { once: true }
  )
})

/**
 * 建立tooltip element
 * @param {String} text tooltip的內容
 * @returns {Element} 回傳新建立的tooltip
 */
function createTooltipElement(text) {
  const tooltip = document.createElement('div')
  tooltip.classList.add('tooltip')
  tooltip.innerText = text
  return tooltip
}

/**
 * mouseover時定位tooltip
 * @param {Element} tooltip mouseover時建立的tooltip
 * @param {Element} element mouseover到的element
 */
function positionTooltip(tooltip, element) {
  const elementRect = element.getBoundingClientRect()
  const preferredPositions = (element.dataset.positions || '').split('|')
  const spacing = parseInt(element.dataset.spacing) ?? DEFAULT_SPACING
  const positions = [...preferredPositions, ...POSITION_ORDER]

  //找對應的定位function執行
  for (let i = 0; i < positions.length; i++) {
    const func = POSITION_TO_FUNCTION_MAP[positions[i]]
    if (func?.(tooltip, elementRect, spacing)) return
    // 定位成功時要中斷迴圈
  }
}

/**
 * 檢查主要位置正確，但側邊超出時，調整側邊位置是否導致它的對邊超出spacing範圍
 * @param {Element} tooltip mouseover時建立的tooltip
 * @param {String} position 要修正的位置 上下左右
 * @param {Number} spacing  element.dataset.spacing 或 DEFAULT_SPACING
 * @returns {Boolean}
 */
function isLessThanSpacing(tooltip, position, spacing) {
  const pos = getComputedStyle(tooltip)[position]
  //把pos轉成數字和去掉後面的"px"
  const posValue = parseFloat(pos.substring(0, pos.length - 2))
  return posValue < spacing
}

/**
 * 把tooltip顯示在element上方
 * @param {Element} tooltip mouseover時建立的tooltip
 * @param {Object} elementRect mouseover到的element的位置
 * @param {String} spacing element.dataset.spacing 或 DEFAULT_SPACING
 * @returns {Boolean} 正確定位時回傳true，告訴positionTooltip中斷迴圈
 */
function positionTooltipTop(tooltip, elementRect, spacing) {
  const tooltipRect = tooltip.getBoundingClientRect()

  tooltip.style.top = `${elementRect.top - tooltipRect.height - spacing}px`
  tooltip.style.left = `${elementRect.left + elementRect.width / 2 - tooltipRect.width / 2}px`

  const bounds = isOutOfBound(tooltip, spacing)
  if (bounds.top) {
    resetTooltipPosition(tooltip)
    return false
  }

  positionTooltipArrow('bottom', tooltip, spacing)

  if (bounds.right) {
    //tooltip右邊超出範圍，把右邊位置拉進範圍
    tooltip.style.right = `${spacing}px`
    //消除一開始定位tooltip所設的left值
    tooltip.style.left = 'initial'

    //調整tooltip箭頭位置
    tooltip.style.setProperty('--left', `${tooltipRect.width - elementRect.width + spacing}px`)

    //處理因為重設右邊位置造成左邊超出邊界的狀況
    if (isLessThanSpacing(tooltip, 'left', spacing)) {
      tooltip.style.left = `${spacing}px`
    }
  }

  if (bounds.left) {
    //tooltip左邊超出範圍，把左邊位置拉近範圍
    tooltip.style.left = `${spacing}px`
    //調整tooltip箭頭位置
    tooltip.style.setProperty('--left', `${elementRect.width - spacing}px`)

    //處理因為重設左邊位置而造成右邊超出邊界的狀況
    if (isLessThanSpacing(tooltip, 'right', spacing)) {
      tooltip.style.right = `${spacing}px`
    }
  }

  return true
}

/**
 * 把tooltip顯示在element下方
 * @param {Element} tooltip mouseover時建立的tooltip
 * @param {Object} elementRect mouseover到的element的位置
 * @param {String} spacing element.dataset.spacing 或 DEFAULT_SPACING
 * @returns {Boolean} 正確定位時回傳true，告訴positionTooltip中斷迴圈
 */
function positionTooltipBottom(tooltip, elementRect, spacing) {
  const tooltipRect = tooltip.getBoundingClientRect()

  tooltip.style.top = `${elementRect.bottom + spacing}px`
  tooltip.style.left = `${elementRect.left + elementRect.width / 2 - tooltipRect.width / 2}px`

  const bounds = isOutOfBound(tooltip, spacing)

  if (bounds.bottom) {
    resetTooltipPosition(tooltip)
    return false
  }
  positionTooltipArrow('top', tooltip, spacing)

  if (bounds.right) {
    tooltip.style.right = `${spacing}px`
    tooltip.style.left = 'initial'
    tooltip.style.setProperty('--left', `${tooltipRect.width - elementRect.width + spacing}px`)
    if (isLessThanSpacing(tooltip, 'left', spacing)) {
      tooltip.style.left = `${spacing}px`
    }
  }

  if (bounds.left) {
    tooltip.style.left = `${spacing}px`
    tooltip.style.setProperty('--left', `${elementRect.width - spacing}px`)
    if (isLessThanSpacing(tooltip, 'right', spacing)) {
      tooltip.style.right = `${spacing}px`
    }
  }

  return true
}

/**
 * 把tooltip顯示在element左方
 * @param {Element} tooltip mouseover時建立的tooltip
 * @param {Object} elementRect mouseover到的element的位置
 * @param {String} spacing element.dataset.spacing 或 DEFAULT_SPACING
 * @returns {Boolean} 正確定位時回傳true，告訴positionTooltip中斷迴圈
 */
function positionTooltipLeft(tooltip, elementRect, spacing) {
  const tooltipRect = tooltip.getBoundingClientRect()
  tooltip.style.top = `${elementRect.top + elementRect.height / 2 - tooltipRect.height / 2}px`
  tooltip.style.left = `${elementRect.left - tooltipRect.width - spacing}px`
  const bounds = isOutOfBound(tooltip, spacing)

  if (bounds.left) {
    resetTooltipPosition(tooltip)
    return false
  }
  positionTooltipArrow('right', tooltip, spacing)
  if (bounds.bottom) {
    tooltip.style.bottom = `${spacing}px`
    tooltip.style.top = 'initial'
    if (isLessThanSpacing(tooltip, 'top', spacing)) {
      tooltip.style.top = `${spacing}px`
    }
  }
  if (bounds.top) {
    tooltip.style.top = `${spacing}px`
    if (isLessThanSpacing(tooltip, 'bottom', spacing)) {
      tooltip.style.bottom = `${spacing}px`
    }
  }
  return true
}

/**
 * 把tooltip顯示在element右方
 * @param {Element} tooltip mouseover時建立的tooltip
 * @param {Object} elementRect mouseover到的element的位置
 * @param {String} spacing element.dataset.spacing 或 DEFAULT_SPACING
 * @returns {Boolean} 正確定位時回傳true，告訴positionTooltip中斷迴圈
 */
function positionTooltipRight(tooltip, elementRect, spacing) {
  const tooltipRect = tooltip.getBoundingClientRect()
  tooltip.style.top = `${elementRect.top + elementRect.height / 2 - tooltipRect.height / 2}px`
  tooltip.style.left = `${elementRect.right + spacing}px`
  const bounds = isOutOfBound(tooltip, spacing)

  if (bounds.right) {
    resetTooltipPosition(tooltip)
    return false
  }
  positionTooltipArrow('left', tooltip, spacing)
  if (bounds.bottom) {
    tooltip.style.bottom = `${spacing}px`
    tooltip.style.top = 'initial'
    if (isLessThanSpacing(tooltip, 'top', spacing)) {
      tooltip.style.top = `${spacing}px`
    }
  }
  if (bounds.top) {
    tooltip.style.top = `${spacing}px`
    if (isLessThanSpacing(tooltip, 'bottom', spacing)) {
      tooltip.style.bottom = `${spacing}px`
    }
  }
  return true
}

/**
 * 檢查最初定位的位置是否超出邊界
 * @param {Element} tooltip 其實是tooltip
 * @param {Number} spacing element.dataset.spacing 或 DEFAULT_SPACING
 * @returns {Object} 回傳值告訴定位functions最初定位是否超出邊界
 */
function isOutOfBound(tooltip, spacing) {
  const rect = tooltip.getBoundingClientRect()
  const containerRect = tooltipContainer.getBoundingClientRect()

  return {
    left: rect.left <= containerRect.left + spacing,
    right: rect.right >= containerRect.right - spacing,
    top: rect.top <= containerRect.top + spacing,
    bottom: rect.bottom >= containerRect.bottom - spacing
  }
}

/**
 * 重置tooltip方位設定值
 * @param {Element} tooltip mouseover時建立的tooltip
 */
function resetTooltipPosition(tooltip) {
  tooltip.style.top = 'initial'
  tooltip.style.left = 'initial'
  tooltip.style.right = 'initial'
  tooltip.style.bottom = 'initial'
}

function positionTooltipTopLeft(tooltip, elementRect, spacing) {
  const tooltipRect = tooltip.getBoundingClientRect()

  tooltip.style.top = `${elementRect.top - tooltipRect.height - spacing}px`
  tooltip.style.left = `${elementRect.left - tooltipRect.width - spacing}px`

  const bounds = isOutOfBound(tooltip, spacing)
  if (bounds.top || bounds.left) {
    resetTooltipPosition(tooltip)
    return false
  }
  positionTooltipArrow('bottom-right', tooltip, spacing)

  return true
}

function positionTooltipTopRight(tooltip, elementRect, spacing) {
  const tooltipRect = tooltip.getBoundingClientRect()

  tooltip.style.top = `${elementRect.top - tooltipRect.height - spacing}px`
  tooltip.style.left = `${elementRect.right + spacing}px`

  const bounds = isOutOfBound(tooltip, spacing)
  if (bounds.top || bounds.right) {
    resetTooltipPosition(tooltip)
    return false
  }
  positionTooltipArrow('bottom-left', tooltip, spacing)

  return true
}

function positionTooltipBottomRight(tooltip, elementRect, spacing) {
  const tooltipRect = tooltip.getBoundingClientRect()

  tooltip.style.top = `${elementRect.bottom + spacing}px`
  tooltip.style.left = `${elementRect.right + spacing}px`

  const bounds = isOutOfBound(tooltip, spacing)
  if (bounds.bottom || bounds.right) {
    resetTooltipPosition(tooltip)

    return false
  }
  positionTooltipArrow('top-left', tooltip, spacing)

  return true
}

function positionTooltipBottomLeft(tooltip, elementRect, spacing) {
  const tooltipRect = tooltip.getBoundingClientRect()

  tooltip.style.top = `${elementRect.bottom + spacing}px`
  tooltip.style.left = `${elementRect.left - tooltipRect.width - spacing}px`

  const bounds = isOutOfBound(tooltip, spacing)
  if (bounds.bottom || bounds.left) {
    resetTooltipPosition(tooltip)
    return false
  }
  positionTooltipArrow('top-right', tooltip, spacing)

  return true
}

/**
 * 定位tooltip的箭頭位置
 * @param {String} direction 箭頭要出現在tooltip的位置，上下左右 "top"，斜角 "top-left"
 * @param {Element} tooltip
 * @param {Number} spacing
 */
function positionTooltipArrow(direction, tooltip, spacing) {
  resetTooltipArrowPosition(tooltip)
  const arrowPosition = direction.split('-')
  if (arrowPosition.length === 1 && spacing < DEFAULT_SPACING) return
  //tooltip出現在上下左右時spacing小於預設的15會看起來不和諧所以不顯示

  setTooltipArrowProperties(arrowPosition, tooltip, spacing)
}

/**
 * 重置tooltip定位箭頭用的custom properties
 * @param {Element} tooltip
 */
function resetTooltipArrowPosition(tooltip) {
  tooltip.style.setProperty('--transform', 'unset')
  tooltip.style.setProperty('--top', 'unset')
  tooltip.style.setProperty('--right', 'unset')
  tooltip.style.setProperty('--bottom', 'unset')
  tooltip.style.setProperty('--left', 'unset')
  tooltip.style.setProperty('--border-top', 'none')
  tooltip.style.setProperty('--border-right', 'none')
  tooltip.style.setProperty('--border-bottom', 'none')
  tooltip.style.setProperty('--border-left', 'none')
}

/**
 * 定位tooltip箭頭的位置和設定樣式
 * @param {Array} position 從positionTooltipArrow傳下來的position array
 * @param {Element} tooltip
 * @param {Number} spacing
 */
function setTooltipArrowProperties([pos1, pos2], tooltip, spacing) {
  if (pos2 && pos1) {
    tooltip.style.setProperty(`--${pos1}`, `-${spacing - 5}px`)
    tooltip.style.setProperty(`--${pos2}`, `-${spacing - 5}px`)
    tooltip.style.setProperty(`--border-${pos1}`, ARROW_STYLE)
    tooltip.style.setProperty(`--border-${pos2}`, ARROW_STYLE)
  } else {
    const tooltipRect = tooltip.getBoundingClientRect()
    const ARROW_DISTANCE_FROM_ELEMENT = spacing - 5
    switch (pos1) {
      case 'bottom':
        tooltip.style.setProperty('--bottom', `-${ARROW_DISTANCE_FROM_ELEMENT}px`)
        tooltip.style.setProperty('--left', `${tooltipRect.width / 2}px`)
        tooltip.style.setProperty('--border-bottom', ARROW_STYLE)
        tooltip.style.setProperty('--border-right', ARROW_STYLE)
        tooltip.style.setProperty('--transform', 'translateX(-50%) rotate(45deg)')
        break
      case 'top':
        tooltip.style.setProperty('--top', `-${ARROW_DISTANCE_FROM_ELEMENT}px`)
        tooltip.style.setProperty('--left', `${tooltipRect.width / 2}px`)
        tooltip.style.setProperty('--border-top', ARROW_STYLE)
        tooltip.style.setProperty('--border-left', ARROW_STYLE)
        tooltip.style.setProperty('--transform', 'translateX(-50%) rotate(45deg)')
        break
      case 'right':
        tooltip.style.setProperty('--top', `${tooltipRect.height / 2}px`)
        tooltip.style.setProperty('--right', `-${ARROW_DISTANCE_FROM_ELEMENT}px`)
        tooltip.style.setProperty('--border-top', ARROW_STYLE)
        tooltip.style.setProperty('--border-right', ARROW_STYLE)
        tooltip.style.setProperty('--transform', 'translateY(-50%) rotate(45deg)')
        break
      case 'left':
        tooltip.style.setProperty('--top', `${tooltipRect.height / 2}px`)
        tooltip.style.setProperty('--left', `-${ARROW_DISTANCE_FROM_ELEMENT}px`)
        tooltip.style.setProperty('--border-bottom', ARROW_STYLE)
        tooltip.style.setProperty('--border-left', ARROW_STYLE)
        tooltip.style.setProperty('--transform', 'translateY(-50%) rotate(45deg)')
        break

      default:
        resetTooltipArrowPosition(tooltip)
        break
    }
  }
}
