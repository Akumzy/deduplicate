/**@type {WebSocket} */
let ws

export function Upload(/**@type {{secure:Boolean; chunkSize:number; origin:string}} */ options) {
  if (typeof es === 'undefined' || (ws && ws.CLOSED)) {
    ws = new WebSocket(options.origin)
    ws.addEventListener('open', ev => {
      upload()
    })
  } else {
    upload()
  }

function upload() {}
}
//   function validateOption() {
//     if (typeof options !== 'object' && options !== null) {
//       throw new Error('options is required to be typeof object.')
//     }
//       for (const [key, value] of Object.entries(options)) {
//         switch (key) {
//             case 'origin':
                
//                 break;
        
//             default:
//                 break;
//         }
//     }
//   }