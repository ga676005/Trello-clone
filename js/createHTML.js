export function createLaneHTML({ id, name, color, tasks = '' } = {}) {
  if (tasks == null) return
  return `
  <div data-id=${id} class="lane" style="--clr-modifier:${color};}">
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
        ${createEditFormHTML()}
      </div>
    </div>
    <form data-task-form class="task-form">
      <input data-task-input class="task-input" type="text" placeholder="新增項目" />
      <button data-submit-task-btn class="submit-task-btn"></button>
    </form>
  </div>`
}

export function createEditFormHTML() {
  return `
  <form data-edit-task-form class="task-edit-form">
    <input type="text" name="task-title" class="edit-task-input"  placeholder="改什麼好呢..." autoComplete="off">
    <div class="task-edit-form__notes-settings">
      <textarea name="task-notes" class="edit-task-notes" placeholder="1. 新增文字&#10;2. 自訂顏色&#10;3. 自訂提示框的顯示順位" autoComplete="off"></textarea>
      
      <div data-arrow="&darr;" data-position="top" class="arrow arrow-up">
        <div class="arrow-box"></div>
        <div class="num-box"></div>
      </div>
      <div data-arrow="&rarr;" data-position="left" class="arrow arrow-left">
        <div class="arrow-box"></div>
        <div class="num-box"></div>
      </div>
      <div data-arrow="&larr;" data-position="right" class="arrow arrow-right">
        <div class="arrow-box"></div>
        <div class="num-box"></div>
      </div>
      <div data-arrow="&uarr;" data-position="bottom" class="arrow arrow-down">
        <div class="arrow-box"></div>
        <div class="num-box"></div>
      </div>
      <div data-arrow="&searr;" data-position="topLeft" class="arrow arrow-nw">
        <div class="arrow-box"></div>
        <div class="num-box"></div>
      </div>
      <div data-arrow="&swarr;" data-position="topRight" class="arrow arrow-ne">
        <div class="arrow-box"></div>
        <div class="num-box"></div>
      </div>
      <div data-arrow="&nearr;" data-position="bottomLeft" class="arrow arrow-sw">
        <div class="arrow-box"></div>
        <div class="num-box"></div>
      </div>
      <div data-arrow="&nwarr;" data-position="bottomRight" class="arrow arrow-se">
        <div class="arrow-box"></div>
        <div class="num-box"></div>
      </div>
    </div>
    <div class="task-edit-form__tooltip-styles" >
      <div class="wrapper">
        <div>
          <span>字體:</span>
          <input type="radio" value=2 id="" name="size"   class="tooltip-font-size-input" hidden>
          <label data-font-size-label=2 class="font-size-big">大</label>

          <input type="radio" value=1.5 id="" name="size"   class="tooltip-font-size-input" hidden>
          <label data-font-size-label=1.5 class="font-size-medium">中</label>  

          <input type="radio" value=1 id="" name="size"   class="tooltip-font-size-input" hidden>
          <label data-font-size-label=1 class="font-size-small">小</label>
        </div>

        <div>
          <label data-tooltip-color-input-label="bg">背景</label>
          <input type="color" data-tooltip-bg-input>
        </div>  
  
        <div>  
          <label data-tooltip-color-input-label="fg">字</label>
          <input type="color" data-tooltip-fg-input>
        </div>  
      </div>
      <div class="wrapper">
        <div>
          <span>箭頭:</span>
          <input type="radio" value="ON"  name="arrow-toggle"   data-arrow-toggle="ON" hidden>
          <label data-arrow-toggle-label="ON">ON</label>
          <input type="radio" value="OFF" name="arrow-toggle"   data-arrow-toggle="OFF" hidden>
          <label data-arrow-toggle-label="OFF">OFF</label>
        </div>
        <div>
          <p class="last-update-time">距離上次修改: <span data-last-edit-text></span></p>
        </div>
      </div>
      
    </div>
    <button class="edit-task-submit-btn" type="submit">OK!</button>
  </form>`
}

export function createTaskHTML({ id, text, notes = null, tooltipPosition = '', fontSize = "1rem", arrowSize = "1.5rem", fgColor = "#000000", bgColor = "#f7f7f7", arrowStyle = "&#10148;", lastEdit = "" } = {}) {
  return `
  <div class="task" 
    data-draggable
    data-task-id=${id}
    data-tooltip="${notes ?? ''}" 
    data-spacing="0" 
    data-positions="${tooltipPosition}" 
    data-font-size="${fontSize}"
    data-arrow-size="${arrowSize}"
    data-fg-color="${fgColor}"
    data-bg-color="${bgColor}"
    data-arrow="${arrowStyle}"
    data-last-Edit="${lastEdit}"
    >
    <ion-icon data-delete-task class="delete-btn" name="close-circle"></ion-icon>
    <ion-icon data-edit-task class="edit-task" name="create-outline"></ion-icon>
    <p class="task-title">${text}</p>
  </div>`
}