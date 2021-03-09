import setupDragAndDrop from './dragAndDrop.js'
import generateUniqueString from './utils/generateUniqueString.js'
import addGlobalEventListener from './utils/addGlobalEventListener.js'
import randomInteger from './utils/randomInteger.js'

const STORAGE_PREFIX = 'TRELLO_CLONE'
const LANES_STORAGE_KEY = `${STORAGE_PREFIX}-lanes`
const DEFAULT_LANES = [
  {
    name: '待辦',
    color: 220,
    tasks: [{ id: '1', text: '在下方輸入內容新增項目' }]
  },
  {
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
    name: '完成',
    color: 150,
    tasks: [{ id: '3', text: '點右上角的圖標變換顏色' }]
  }
]
const DEFAULT_NEW_LANE = {
  name: '標題',
  color: undefined,
  tasks: [{ id: generateUniqueString(5), text: '在下方輸入內容新增項目' }]
}

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
  const startLaneId = startZone.dataset.laneId
  const endLaneId = endZone.dataset.laneId

  //找出欄位裡的tasks
  const startLaneTasks = lanes.find((l) => l.name === startLaneId).tasks
  const endLaneTasks = lanes.find((l) => l.name === endLaneId).tasks

  //找出被拖曳的task
  const task = startLaneTasks.find((t) => t.id === dragElement.id)

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
}

function createTaskHTML(task) {
  return `
  <div class="task" data-draggable id=${task.id}>
    <button class='delete-btn'>
      <svg xmlns='http://www.w3.org/2000/svg' class='ionicon delete' viewBox='0 0 512 512'><title>Close</title><path fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='32' d='M368 368L144 144M368 144L144 368'/></svg>
    </button>
    ${task.text}
  </div>`
}

function createLaneHTML({ name, color, tasks } = {}) {
  return `
  <div class="lane" style="--clr-modifier:${color ?? randomInteger(1, 360)};">
    <div class="lane__header">
      <h2 class="lane__title">
         ${name}
      </h2>
      <button class="color-bar-toggler"></button>
      <input data-color-bar type="range" min="0" max="360" step="5" value=${color}>
      <button class='delete-btn'>
        <svg xmlns='http://www.w3.org/2000/svg' class='ionicon delete' viewBox='0 0 512 512'><title>Close</title><path fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='32' d='M368 368L144 144M368 144L144 368'/></svg>
      </button>
    </div>
    <div class="tasks" data-drop-zone data-lane-id="${name}">
      ${tasks.map(createTaskHTML).join('')}
    </div>
    <form data-task-form class="task-form">
      <input data-task-input class="task-input" type="text" placeholder="新增項目" />
      <button data-submit-task-btn class="submit-task-btn"></button>
    </form>
  </div>`
}

const fileInput = document.querySelector('#uploadJson')
const downloadBtn = document.querySelector('#downloadJson')

//上傳
fileInput.addEventListener('change', handleUpload)

//下載
downloadBtn.addEventListener('click', handleDownload)

function handleUpload() {
  const file = fileInput.files[0]
  const reader = new FileReader()

  reader.addEventListener('load', (e) => {
    const uploadData = JSON.parse(reader.result)

    // 檢查同一個欄位但不同的task
    lanes.forEach((lane) => {
      //找出同一個欄位
      const uploadTasks = uploadData.find((entry) => entry.name === lane.name)
        .tasks

      // 找出不同的tasks
      const distinctTasks = uploadTasks.filter((uploadTask) => {
        const sameTask = lane.tasks.some(
          (laneTask) => laneTask.id === uploadTask.id
        )
        return sameTask ? false : true
      })

      // 把不同的tasks加到原本的tasks後面
      lane.tasks = [...lane.tasks, ...distinctTasks]
    })

    // 上傳檔案跟目前檔案不同的欄位
    const distinctLanes = uploadData.filter((entry) => {
      const sameLane = lanes.some((lane) => lane.id === entry.id)
      return sameLane ? false : true
    })

    lanes = [...lanes, ...distinctLanes]
    console.log(lanes)

    renderLanes()
    saveLanes()
  })

  reader.readAsText(file)
}

function handleDownload() {
  const filename = 'trello_clone.json'
  const element = document.createElement('a')

  element.href = `data:application/json;charset=utf-8, ${encodeURIComponent(
    JSON.stringify(lanes)
  )}`
  element.download = filename
  document.body.appendChild(element)

  element.click()

  element.remove()
}

const addLaneBtn = document.querySelector('[data-add-lane]')

addLaneBtn.addEventListener('click', addLane)

function addLane() {
  const laneHTML = createLaneHTML(DEFAULT_NEW_LANE)
  lanesContainer.innerHTML += laneHTML
  lanes = [...lanes, DEFAULT_NEW_LANE]
  saveLanes()
}
