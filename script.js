import setupDragAndDrop from './dragAndDrop.js'
import generateUniqueString from './utils/generateUniqueString.js'
import addGlobalEventListener from './utils/addGlobalEventListener.js'

const STORAGE_PREFIX = 'TRELLO_CLONE'
const LANES_STORAGE_KEY = `${STORAGE_PREFIX}-lanes`
const DEFAULT_LANES = {
  backlog: [{ id: generateUniqueString(5), text: 'Create your first task' }],
  doing: [{ id: generateUniqueString(5), text: 'Pa games' }],
  done: [{ id: generateUniqueString(5), text: 'Nothing' }]
}

let lanes = loadLanes()
renderTasks()

setupDragAndDrop(onDragComplete)

addGlobalEventListener('submit', '[data-task-form]', (e) => {
  e.preventDefault()

  const taskInput = e.target.querySelector('[data-task-input]')
  const taskText = taskInput.value
  if (taskText === '') return

  const task = { id: generateUniqueString(5), text: taskText }
  const laneElement = e.target.closest('.lane').querySelector('[data-lane-id]')
  lanes[laneElement.dataset.laneId].push(task)

  const taskElement = createTaskHTML(task)
  laneElement.innerHTML += taskElement
  taskInput.value = ''

  saveLanes()
})

/**
 * 拖曳結束，儲存更新的資訊
 * @param {Object} information
 */
function onDragComplete({ startZone, endZone, dragElement, index } = {}) {
  //欄位名
  const startLaneId = startZone.dataset.laneId
  const endLaneId = endZone.dataset.laneId

  //找出欄位裡的tasks
  const startLaneTasks = lanes[startLaneId]
  const endLaneTasks = lanes[endLaneId]

  //找出被拖曳的task
  const task = startLaneTasks.find((t) => t.id === dragElement.id)

  //把它從原本的陣列移除，用回傳的index插入到目標陣列中
  startLaneTasks.splice(startLaneTasks.indexOf(task), 1)
  endLaneTasks.splice(index, 0, task)

  saveLanes()
}

function saveLanes() {
  localStorage.setItem(LANES_STORAGE_KEY, JSON.stringify(lanes))
}

function loadLanes() {
  const lanesJson = localStorage.getItem(LANES_STORAGE_KEY)
  return JSON.parse(lanesJson) || DEFAULT_LANES
}

function renderTasks() {
  Object.entries(lanes).forEach(([laneId, tasks]) => {
    const lane = document.querySelector(`[data-lane-id=${laneId}]`)
    const tasksHTML = tasks.map(createTaskHTML).join('')
    lane.innerHTML = tasksHTML
  })
}

function createTaskHTML(task) {
  return `
  <div class="task" data-draggable id=${task.id}>
    ${task.text}
  </div>`
}
