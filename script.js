import './tooltip.js'
import setupDragAndDrop from './dragAndDrop.js'
import generateUniqueString from './utils/generateUniqueString.js'
import addGlobalEventListener from './utils/addGlobalEventListener.js'
import randomInteger from './utils/randomInteger.js'

const STORAGE_PREFIX = 'TRELLO_CLONE'
const LANES_STORAGE_KEY = `${STORAGE_PREFIX}-lanes`
const DEFAULT_LANES = [
  {
    id: '1',
    name: '待辦',
    color: 220,
    tasks: [{ id: '1', text: '在下方輸入內容新增項目' }]
  },
  {
    id: '2',
    name: '進行中',
    color: 0,
    tasks: [
      {
        id: '2',
        text: '按著我移動到其他欄位中'
      }
    ]
  },
  {
    id: '3',
    name: '完成',
    color: 150,
    tasks: [{ id: '3', text: '點右上角的圖標變換顏色' }]
  }
]

const lanesContainer = document.querySelector('[data-lanes-container]')

let lanes = loadLanes()
renderLanes()

setupDragAndDrop(onDragComplete)

/**
 * 拖曳結束，儲存更新的資訊
 * @param {Object} information
 */
function onDragComplete({ startZone, endZone, dragElement, index } = {}) {
  //欄位名
  const startLaneId = startZone.closest('[data-id]').dataset.id
  const endLaneId = endZone.closest('[data-id]').dataset.id

  //找出欄位裡的tasks
  const startLaneTasks = lanes.find((l) => l.id === startLaneId).tasks
  const endLaneTasks = lanes.find((l) => l.id === endLaneId).tasks
  //找出被拖曳的task

  const task = startLaneTasks.find((t) => t.id === dragElement.dataset.taskId)

  //把它從原本的陣列移除，用回傳的index插入到目標陣列中
  startLaneTasks.splice(startLaneTasks.indexOf(task), 1)
  endLaneTasks.splice(index, 0, task)
  saveLanes()
}

// form submit
addGlobalEventListener('submit', '[data-task-form]', (e) => {
  e.preventDefault()
  e.target.classList.remove('show-add-button')

  const taskInput = e.target.querySelector('[data-task-input]')
  const taskText = taskInput.value
  if (taskText === '') return

  const task = { id: generateUniqueString(5), text: taskText }
  const laneElement = e.target.closest('.lane').querySelector('[data-lane-id]')
  const laneId = laneElement.dataset.laneId

  lanes.find((i) => i.name === laneId).tasks.push(task)

  const taskElement = createTaskHTML(task)
  laneElement.innerHTML += taskElement
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

// Create task HTML
function createTaskHTML({ id, text } = {}) {
  return `
  <div class="task" data-draggable data-task-id=${id} data-tooltip="test where is my color" data-spacing="15" data-positions="bottom">
    <ion-icon data-delete-task class="delete-btn" name="close-circle"></ion-icon>
    <ion-icon data-edit-task class="edit-task" name="create-outline"></ion-icon>
    <p class="task-title">${text}</p>
  </div>`
}

// Create lane HTML
function createLaneHTML({ id, name, color, tasks, style } = {}) {
  return `
  <div data-id=${id} class="lane" style="--clr-modifier:${color};${style ?? ''}">
    <div class="lane__header">
      <h2 class="lane__title">
         ${name}
      </h2>
      <button class="color-bar-toggler"></button>
      <input data-color-bar class="slider" type="range" min="0" max="360" step="5" value=${color}>
      <ion-icon data-delete-lane class="delete-btn" name="close-circle"></ion-icon>
      <form class="lane__header__form">
        <div class="form-group">
          <input type="text" data-change-title-input autoComplete="off" placeholder="請輸入...">
          <button class="submit-btn" type="submit">
            <ion-icon name="checkmark-circle"></ion-icon>
          </button>
        </div>
      </form>
    </div>
    <div class="tasks " data-drop-zone data-lane-id="${name}">
      ${tasks.map(createTaskHTML).join('')}
      <div class="edit-task-form-container">
        <form data-edit-task-form class="task-edit-form">
          <input type="text" name="task-title" class="edit-task-input"  placeholder="修改標題">
          <textarea name="task-notes" class="edit-task-notes" placeholder="新增備註..."></textarea>
          <button class="edit-task-submit-btn" type="submit">OK!</button>
        </form>
      </div>
    </div>
    <form data-task-form class="task-form">
      <input data-task-input class="task-input" type="text" placeholder="新增項目" />
      <button data-submit-task-btn class="submit-task-btn"></button>
    </form>
  </div>`
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
    // style: "transform: scale(0);"
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

    lanes.forEach((lane) => {
      // 找出同一個欄位
      const uploadLane = uploadData.find((entry) => entry.id === lane.id)

      if (uploadLane) {
        const { tasks } = uploadLane

        // 用上傳的檔案覆蓋同一個欄位的名稱
        lane.name = uploadLane.name

        // 用上傳的內容覆蓋相同id的task
        lane.tasks.forEach((localTask) => {
          const uploadTask = tasks.find((uploadTask) => uploadTask.id === localTask.id)
          if (uploadTask) {
            localTask.text = uploadTask.text
          }
        })

        // 找出上傳檔案和目前檔案同一個欄位中，不同的tasks
        const distinctTasks = tasks.filter((uploadTask) => {
          const sameTask = lane.tasks.some((laneTask) => laneTask.id === uploadTask.id)
          return sameTask ? false : true
        })

        // 把不同的tasks加到原本的tasks後面
        lane.tasks = [...lane.tasks, ...distinctTasks]
      }
    })

    // 上傳檔案跟目前檔案不同的欄位
    const distinctLanes = uploadData.filter((entry) => {
      const sameLane = lanes.some((lane) => lane.id === entry.id)
      return sameLane ? false : true
    })

    lanes = [...lanes, ...distinctLanes]

    renderLanes()
    animateLoading()

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

  deleteBtn.nextElementSibling.textContent = isDeleteMode ? '解除刪除模式' : '進入刪除模式'
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
function setupHideElementEvents(element, selector, className, targetElements) {
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
  const input = tasksContainer.querySelector('.edit-task-input')
  const textarea = tasksContainer.querySelector('.edit-task-notes')
  const taskTitle = task.querySelector('.task-title').textContent.trim()
  input.value = taskTitle

  tasksContainer.classList.add('show-edit-form')
  tasksContainer.dataset.taskId = task.dataset.taskId
  tasksContainer.dataset.taskTitle = taskTitle
})

addGlobalEventListener('submit', '[data-edit-task-form]', (e) => {
  e.preventDefault()
  const input = e.target.elements['task-title']
  const textarea = e.target.elements['task-notes']
  const tasksContainer = e.target.closest('.tasks')
  const taskId = tasksContainer.dataset.taskId
  const $lane = tasksContainer.closest('.lane')
  const $task = tasksContainer.querySelector(`[data-task-id="${taskId}"]`)

  const newTitle = input.value
  if (newTitle.trim() === '') return

  $task.querySelector('.task-title').textContent = newTitle
  let tasks = lanes.find((l) => l.id === $lane.dataset.id).tasks
  const task = tasks.find((t) => t.id === taskId)
  task.text = newTitle
  saveLanes()

  tasksContainer.classList.remove('show-edit-form')
})

/**
 * <form data-edit-task-form class="task-edit-form">
      <input type="text" class="edit-task-input"  placeholder="修改標題">
      <textarea class="edit-task-notes" placeholder="新增備註..."></textarea>
      <button class="edit-task-submit-btn" type="submit">OK!</button>
   </form>
 */
