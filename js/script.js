import './tooltip.js'
import setupDragAndDrop from './dragAndDrop.js'
import generateUniqueString from '../utils/generateUniqueString.js'
import addGlobalEventListener from '../utils/addGlobalEventListener.js'
import randomInteger from '../utils/randomInteger.js'
import { createLaneHTML, createTaskHTML } from './createHTML.js'
const STORAGE_PREFIX = 'TRELLO_CLONE'
const LANES_STORAGE_KEY = `${STORAGE_PREFIX}-lanes`
const DEFAULT_LANES = [
  {
    id: '1',
    name: '待辦',
    color: 220,
    tasks: [{ id: '1', text: '在下方輸入內容新增項目', notes: null }]
  },
  {
    id: '2',
    name: '進行中',
    color: 0,
    tasks: [{ id: '2', text: '按著我移動到其他欄位中', notes: null }]
  },
  {
    id: '3',
    name: '完成',
    color: 150,
    tasks: [{ id: '3', text: '點右上角的圖標變換顏色', notes: null }]
  }
]
const lanesContainer = document.querySelector('[data-lanes-container]')

setupDragAndDrop(onDragComplete)

/**
 * 拖曳結束，儲存更新的資訊
 * @param {Object} information
 */
function onDragComplete({ startZone, endZone, dragElement, index } = {}) {

  //欄位id
  const startLaneId = startZone.closest('[data-id]').dataset.id
  const endLaneId = endZone.closest('[data-id]').dataset.id

  //找出欄位裡的tasks
  const startLaneTasks = lanes.find((l) => l.id === startLaneId).tasks
  const endLaneTasks = lanes.find((l) => l.id === endLaneId).tasks

  //找出被拖曳的task
  const task = startLaneTasks.find((t) => t.id === dragElement.dataset.taskId)

  if (task) {
    //把它從原本的陣列移除，用回傳的index插入到目標陣列中
    startLaneTasks.splice(startLaneTasks.indexOf(task), 1)
    endLaneTasks.splice(index, 0, task)
    saveLanes()
  }
}

// add new task
addGlobalEventListener('submit', '[data-task-form]', (e) => {
  e.preventDefault()
  e.target.classList.remove('show-add-button')
  const taskInput = e.target.querySelector('[data-task-input]')
  const taskText = taskInput.value
  if (taskText === '') return
  const newTask = { id: generateUniqueString(5), text: taskText, notes: null, tooltipPosition: '' }
  const lane = e.target.closest('.lane')
  const laneId = lane.dataset.id
  const tasksContainer = lane.querySelector('.tasks')

  lanes.find((lane) => lane.id === laneId).tasks.push(newTask)

  const taskElement = createTaskHTML(newTask)
  tasksContainer.innerHTML += taskElement
  taskInput.value = ''

  saveLanes()
})

// Change color
addGlobalEventListener('input', '[data-color-bar]', (e) => {
  const lane = e.target.closest('.lane')
  const laneId = lane.querySelector('[data-lane-id]').dataset.laneId
  const colorValue = e.target.value
  lane.style.setProperty('--clr-modifier', colorValue)
  lanes.find((l) => l.name === laneId).color = colorValue
  saveLanes()
})

// Show adding task button
addGlobalEventListener('input', '[data-task-input]', (e) => {
  const input = e.target
  const hasValue = input.value.length > 0
  input.parentElement.classList.toggle('show-add-button', hasValue)
})

function saveLanes() {
  localStorage.setItem(LANES_STORAGE_KEY, JSON.stringify(lanes))
}

function loadLanes() {
  const lanesJson = localStorage.getItem(LANES_STORAGE_KEY)
  return JSON.parse(lanesJson) || DEFAULT_LANES
}

function renderLanes() {
  const lanesHTML = lanes.map(createLaneHTML).join('')
  lanesContainer.innerHTML = lanesHTML
  if (lanesContainer.children.length > 0) animateLoading()
}

// add lane
const addLaneBtn = document.querySelector('[data-add-lane]')
addLaneBtn.addEventListener('click', addLane)

function addLane() {
  const DEFAULT_NEW_LANE = {
    id: generateUniqueString(5),
    name: '自訂標題',
    color: randomInteger(1, 360),
    tasks: [{ id: generateUniqueString(5), text: '在下方輸入內容新增項目' }]
  }

  const laneHTML = createLaneHTML(DEFAULT_NEW_LANE)
  lanesContainer.innerHTML += laneHTML

  const lane = lanesContainer.lastElementChild
  animateAddLane(lane)

  lanes = [...lanes, DEFAULT_NEW_LANE]
  saveLanes()
}

const fileInput = document.querySelector('#uploadJson')
const downloadBtn = document.querySelector('#downloadJson')
fileInput.addEventListener('change', handleUpload)
downloadBtn.addEventListener('click', handleDownload)

function handleUpload() {
  const file = fileInput.files[0]
  const reader = new FileReader()

  reader.addEventListener('load', (e) => {
    const uploadData = JSON.parse(reader.result)

    const updatedLocalLanes = lanes.map(localLane => {
      const uploadLane = uploadData.find(entry => entry.id === localLane.id)
      if (uploadLane == undefined) return localLane

      const { tasks: uploadTasks } = uploadLane
      const { tasks: localTasks } = localLane

      const tasks = [...localTasks, ...uploadTasks]

      const updatedTasks = tasks.reduce((updatedTasks, task) => {
        const sameIdTask = updatedTasks.find(t => t.id === task.id)

        if (sameIdTask) {
          const taskId = sameIdTask.id
          const taskIndex = updatedTasks.findIndex(t => t.id === taskId)
          updatedTasks[taskIndex] = task
        } else {
          updatedTasks.push(task)
        }
        return updatedTasks
      }, [])

      return { ...localLane, name: uploadLane.name, tasks: updatedTasks }
    })

    const distinctLanes = uploadData.filter(uploadLane => {
      const hasSameLane = lanes.some(localLane => localLane.id === uploadLane.id)
      return !hasSameLane
    })

    lanes = [...updatedLocalLanes, ...distinctLanes]

    // DOM
    renderLanes()
    animateLoading()

    // data
    saveLanes()
  })

  reader.readAsText(file)
}

function handleDownload() {
  const filename = 'trello_clone.json'
  const element = document.createElement('a')

  element.href = `data:application/json;charset=utf-8, ${encodeURIComponent(JSON.stringify(lanes))}`
  element.download = filename
  document.body.appendChild(element)

  element.click()

  element.remove()
}

// delete task
addGlobalEventListener('click', '[data-delete-task]', (e) => {
  const $task = e.target.closest('.task')
  const $lane = e.target.closest('.lane')

  const lane = lanes.find((l) => l.id === $lane.dataset.id)
  lane.tasks = lane.tasks.filter((t) => t.id !== $task.dataset.taskId)
  saveLanes()

  animateDeleteTask($task)
})

// delete lane
addGlobalEventListener('click', '[data-delete-lane]', (e) => {
  const lane = e.target.closest('.lane')
  lanes = lanes.filter((l) => l.id !== lane.dataset.id)
  saveLanes()

  animateDeleteLane(lane)
})

// delete mode button
const deleteBtn = document.querySelector('[data-delete-mode]')

deleteBtn.addEventListener('click', (e) => {
  document.body.classList.toggle('delete-mode')
  const isDeleteMode = document.body.classList.contains('delete-mode')

  deleteBtn.nextElementSibling.textContent =
    isDeleteMode
      ? '解除刪除模式'
      : '進入刪除模式'
})

// make toolbar labels clickable
addGlobalEventListener('click', '.toolbar__list-item label', (e) => {
  e.target.parentElement.querySelector('button').click()
})

// scroll and add background color to header
window.addEventListener('scroll', (e) => {
  const isScrollDown = window.scrollY > 50
  document.body.classList.toggle('scroll-down', isScrollDown)
})


// show edit title input
document.addEventListener('dblclick', (e) => {
  const header = e.target.closest('.lane__header')
  if (!header) return
  header.classList.add('show-input')
  const input = header.querySelector('[data-change-title-input]')
  const title = header.querySelector('.lane__title')

  input.value = title.textContent.trim()

  setupHideElementEvents(header, '.lane__header', 'show-input')
})

// edit lane title
addGlobalEventListener('submit', '.lane__header__form', (e) => {
  e.preventDefault()
  const text = e.target.querySelector('[data-change-title-input]').value
  if (text.trim() === '') return

  const header = e.target.closest('.lane__header')
  const title = header.querySelector('.lane__title')
  const originalName = title.textContent.trim()

  title.textContent = text
  header.classList.remove('show-input')

  const laneContainer = header.closest('.lane')
  const lane = laneContainer.querySelector('.tasks')

  lane.dataset.laneId = text

  lanes.find((l) => l.name === originalName).name = text
  saveLanes()
})

// Hide element
function setupHideElementEvents(element, selector, className) {
  const hideFunction = (e) => {
    if (e.target.closest(selector) === element) return
    element.classList.remove(className)
    document.removeEventListener('click', hideFunction)
  }

  document.addEventListener('click', hideFunction)
}

// Edit task
addGlobalEventListener('click', '[data-edit-task]', (e) => {
  const task = e.target.closest('.task')
  const tasksContainer = e.target.closest('.tasks')
  const titleInput = tasksContainer.querySelector('.edit-task-input')
  const textarea = tasksContainer.querySelector('.edit-task-notes')
  const taskTitle = task.querySelector('.task-title').textContent.trim()
  const taskNotes = task.dataset.tooltip
  const tooltipPosition = task.dataset.positions === '' ? [] : task.dataset.positions.split('|')
  const fontSize = parseFloat(task.dataset.fontSize)
  const arrowSize = parseFloat(task.dataset.arrowSize)
  const radioButton = tasksContainer.querySelector(`.tooltip-font-size-input[value='${fontSize}']`)
  const fgInput = tasksContainer.querySelector('[data-tooltip-fg-input]')
  const bgInput = tasksContainer.querySelector('[data-tooltip-bg-input]')
  const bgColor = task.dataset.bgColor
  const fgColor = task.dataset.fgColor
  const showArrow = arrowSize > 0
  const arrowOnToggle = tasksContainer.querySelector('[data-arrow-toggle="ON"]')
  const arrowOffToggle = tasksContainer.querySelector('[data-arrow-toggle="OFF"]')

  titleInput.value = taskTitle
  textarea.value = taskNotes
  textarea.style.fontSize = `${fontSize}rem`
  textarea.style.color = fgColor
  textarea.style.backgroundColor = bgColor
  radioButton.checked = true
  fgInput.value = fgColor
  bgInput.value = bgColor
  showArrow ? arrowOnToggle.checked = true : arrowOffToggle.checked = true

  tasksContainer.classList.add('show-edit-form')
  tasksContainer.dataset.taskId = task.dataset.taskId
  tasksContainer.dataset.taskTitle = taskTitle

  const buttons = [...tasksContainer.querySelectorAll('.arrow')]
  buttons.forEach((btn) => {
    if (tooltipPosition.some((p) => p === btn.dataset.position)) {
      btn.classList.add('is-selected')
    }
    btn.querySelector('.arrow-box').innerHTML = showArrow ? btn.dataset.arrow : "&#10063;"
  })
  showPositionOrderNumber(tooltipPosition, buttons)
})

// Show tooltip position order number besides arrows
function showPositionOrderNumber(tooltipPosition, buttons) {
  buttons.forEach(b => b.querySelector('.num-box').innerHTML = "")
  tooltipPosition.forEach((position, index) => {
    const btn = buttons.find((b) => b.dataset.position === position)
    if (btn) {
      const numCode = `&#1010${index + 2};`
      const numCode2 = `&#1011${index + 2};`
      const numBox = btn.querySelector('.num-box');
      // btn.dataset.order = index + 1
      numBox.innerHTML = numCode
    }
  })
}

// arrows around edit form textarea
addGlobalEventListener('click', '.arrow', (e) => {
  const button = e.target
  const buttons = [...button.parentElement.querySelectorAll('.arrow')]
  const positionName = button.dataset.position.trim()
  const tasksContainer = e.target.closest('.tasks')
  const taskId = tasksContainer.dataset.taskId
  const task = tasksContainer.querySelector(`[data-task-id="${taskId}"]`)
  let tooltipPosition = task.dataset.positions === '' ? [] : task.dataset.positions.split('|')
  button.classList.toggle('is-selected')
  const isSelected = button.classList.contains('is-selected')

  tooltipPosition = isSelected
    ? [...tooltipPosition, positionName]
    : tooltipPosition.filter((position) => position !== positionName)

  showPositionOrderNumber(tooltipPosition, buttons)

  task.dataset.positions = tooltipPosition.join('|')
})

// submit edited task
addGlobalEventListener('submit', '[data-edit-task-form]', (e) => {
  e.preventDefault()
  const input = e.target.elements['task-title']
  const textarea = e.target.elements['task-notes']
  const buttons = [...e.target.querySelectorAll('.arrow')]
  buttons.forEach((b) => b.classList.remove('is-selected'))
  const tasksContainer = e.target.closest('.tasks')
  const taskId = tasksContainer.dataset.taskId
  const $lane = tasksContainer.closest('.lane')
  const $task = tasksContainer.querySelector(`[data-task-id="${taskId}"]`)

  const newTitle = input.value
  if (newTitle.trim() === '') return
  const newNotes = textarea.value
  $task.dataset.tooltip = newNotes.trim()
  $task.querySelector('.task-title').textContent = newTitle

  const tasks = lanes.find((l) => l.id === $lane.dataset.id).tasks
  const task = tasks.find((t) => t.id === taskId)

  task.text = newTitle
  task.notes = newNotes
  task.tooltipPosition = $task.dataset.positions
  task.fontSize = $task.dataset.fontSize
  task.arrowSize = $task.dataset.arrowSize
  task.fgColor = $task.dataset.fgColor
  task.bgColor = $task.dataset.bgColor

  saveLanes()

  tasksContainer.classList.remove('show-edit-form')
})

// tooltip font size input
addGlobalEventListener('input', '.tooltip-font-size-input', e => {
  const fontSize = parseFloat(e.target.value)
  const tasksContainer = e.target.closest('.tasks')
  const textarea = tasksContainer.querySelector('.edit-task-notes')
  const taskId = tasksContainer.dataset.taskId
  const task = tasksContainer.querySelector(`[data-task-id="${taskId}"]`)

  task.dataset.fontSize = `${fontSize}rem`
  task.dataset.arrowSize = `${fontSize + 0.5}rem`

  textarea.style.fontSize = `${fontSize}rem`
})

// tooltip font size input label
addGlobalEventListener('click', '[data-font-size-label]', e => {
  const value = e.target.dataset.fontSizeLabel
  const input = e.target.parentElement.querySelector(`.tooltip-font-size-input[value="${value}"]`)
  if (input) input.click()
})

// arrow toggle
addGlobalEventListener('change', '[data-arrow-toggle]', e => {
  const tasksContainer = e.target.closest('.tasks')
  const taskId = tasksContainer.dataset.taskId
  const task = tasksContainer.querySelector(`[data-task-id="${taskId}"]`)
  const fontSize = parseFloat(task.dataset.fontSize)
  const status = e.target.value

  task.dataset.arrowSize = status === "ON" ? `${fontSize + 0.5}rem` : "0rem"

  const buttons = [...tasksContainer.querySelectorAll('.arrow')]
  buttons.forEach((btn) => {
    btn.querySelector('.arrow-box').innerHTML = status === "ON" ? btn.dataset.arrow : "&#10063;"
  })
})

// arrow toggle label
addGlobalEventListener('click', '[data-arrow-toggle-label]', e => {
  const value = e.target.dataset.arrowToggleLabel
  const input = e.target.parentElement.querySelector(`[data-arrow-toggle=${value}]`)

  if (input) input.click()
})


// text color input
addGlobalEventListener('input', '[data-tooltip-fg-input]', e => {
  const tasksContainer = e.target.closest('.tasks')
  const taskId = tasksContainer.dataset.taskId
  const task = tasksContainer.querySelector(`[data-task-id="${taskId}"]`)
  const fgColor = e.target.value
  const textarea = tasksContainer.querySelector('.edit-task-notes')


  task.dataset.fgColor = fgColor
  textarea.style.color = fgColor
})

// bg color input
addGlobalEventListener('input', '[data-tooltip-bg-input]', e => {
  const tasksContainer = e.target.closest('.tasks')
  const taskId = tasksContainer.dataset.taskId
  const task = tasksContainer.querySelector(`[data-task-id="${taskId}"]`)
  const bgColor = e.target.value
  const textarea = tasksContainer.querySelector('.edit-task-notes')


  task.dataset.bgColor = bgColor
  textarea.style.backgroundColor = bgColor
})

// text and bg color inputs' labels
addGlobalEventListener('click', '[data-tooltip-color-input-label]', e => {
  const value = e.target.dataset.tooltipColorInputLabel
  const input = e.target.parentElement.querySelector(`[data-tooltip-${value}-input]`)
  if (input) input.click()
})


// animation
function animateDeleteLane(lane) {
  gsap.to(lane, { opacity: 0, duration: 0.5, ease: Power4.easeOut })
  gsap.to(lane, {
    rotation: 30,
    duration: 0.5,
    ease: Power4.easeOut,
    onComplete: function () {
      lane.remove()
    }
  })
  gsap.to(lane, { x: 150, y: 300, duration: 2, ease: Power4.easeOut })
}

function animateDeleteTask($task) {
  gsap.to($task, {
    x: 500,
    duration: 0.4,
    ease: 'elastic.in(1.5, 0.75)',
    onComplete: function () {
      $task.remove()
    }
  })
  gsap.to($task, {
    y: 'random(20,-20)',
    duration: 0.2,
    ease: 'elastic.in(1.5, 0.75)'
  })
  gsap.to($task, {
    y: 'random(20,-20)',
    duration: 0.2,
    ease: 'elastic.in(1.5, 0.75)'
  })
}

function animateAddLane(lane) {
  gsap.set('.toolbar', { pointerEvents: ' none ' })
  gsap.set(lane, { scale: 0.5 })
  gsap.to(lane, {
    scale: 1,
    duration: 0.3,
    y: 0,
    opacity: 1,
    ease: 'back.out(2)',
    onComplete: function () {
      document.querySelector('.toolbar').style.pointerEvents = 'unset'
    }
  })
}

function animateLoading() {
  gsap.set('.lane', { y: '-500' })
  gsap.set('.toolbar', { pointerEvents: ' none ' })
  gsap.to('.lane', {
    duration: 0.4,
    ease: 'elastic.out(1, 0.3)',
    opacity: 1,
    y: 0,
    stagger: 0.35,
    delay: 0.5,
    onComplete: function () {
      document.querySelector('.toolbar').style.pointerEvents = 'unset'
    }
  })
}
// animation

let lanes = loadLanes()
renderLanes()
