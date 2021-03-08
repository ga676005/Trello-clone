import setupDragAndDrop from './dragAndDrop.js'

setupDragAndDrop(onDragComplete)

/**
 * 取得拖曳結束後的一些資訊
 * @param {Object} information 
 */
function onDragComplete(information) {
  console.log(information)
}