/**@type {HTMLInputElement} */
const input = document.querySelector('#file')
input.addEventListener('change', onChange, false)
/**@type {Worker} */
let worker
/**
 *
 * @param {InputEvent} ev
 */
async function onChange(ev) {
  if (typeof worker === 'undefined') {
    worker = new Worker('worker.js')
    worker.onmessage = function onmessage(payload) {
      console.timeEnd('time')

      console.table(payload.data.blocks)
    }
    worker.onerror = function onmessage(error) {
      console.log(error)
    }
  }
  /**@type {HTMLInputElement} */
  const input = ev.target
  console.time('time')
  worker.postMessage(input.files)
}
