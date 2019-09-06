'use strict'

import { createReadStream } from 'fs'
import { create } from './content-hasher'
interface BlockObject {
  start: number
  end: number
  hash: string
  order: number
}
export  function createBlocks(filePath: string, size: number): Promise<{ hash: string; blocks: BlockObject[] }> {
  return new Promise((resolve, reject) => {
    if (!size) return resolve()
    const hasher = create(),
      f = createReadStream(filePath)
    f.on('data', hasher.update)
    f.on('end', err => {
      const hash = hasher.digest('hex', size)
      if (err) return reject(err)
      resolve({ hash, blocks: hasher.blocks })
      f.close()
    })
    f.on('error', err => {
      console.log('Hash error: ', err)
      reject(err)
    })
  })
}
export default createBlocks
