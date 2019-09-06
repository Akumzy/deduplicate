'use strict'

import crypto from 'crypto'
import { AssertionError } from 'assert'
const BLOCK_SIZE = 4 * 1024 * 1024
class ContentHasher {
  overallHasher: crypto.Hash | null
  blockHasher: crypto.Hash | null
  blockPos: number
  blocks: { start: number; end: number; hash: string; order: number }[]
  totalChuck: number
  addedNewBlock: boolean
  order: number
  constructor(overallHasher: crypto.Hash, blockHasher: crypto.Hash) {
    this.overallHasher = overallHasher
    this.blockHasher = blockHasher
    this.blockPos = 0
    this.blocks = []
    this.totalChuck = 0
    this.addedNewBlock = false
    this.order = 0
  }

  update = (data: Buffer) => {
    if (this.overallHasher === null) {
      throw new AssertionError({
        message: "can't use this object anymore; you already called digest()",
      })
    }

    let offset = 0
    while (offset < data.length && this.blockHasher) {
      if (this.blockPos === BLOCK_SIZE) {
        const buf = this.blockHasher.digest()
        this.overallHasher.update(buf)
        this.addBlock(buf, BLOCK_SIZE)
        this.blockHasher = crypto.createHash('sha256')
        this.blockPos = 0
      }

      let spaceInBlock = BLOCK_SIZE - this.blockPos,
        inputPartEnd = Math.min(data.length, offset + spaceInBlock),
        inputPartLength = inputPartEnd - offset
      this.blockHasher.update(data.slice(offset, inputPartEnd))

      this.blockPos += inputPartLength
      offset = inputPartEnd
    }
  }

  digest = (encoding: any, size?: number) => {
    if (this.overallHasher === null) {
      throw new AssertionError({
        message: "can't use this object anymore; you already called digest()",
      })
    }

    if (this.blockPos > 0 && this.blockHasher) {
      const buf = this.blockHasher.digest()
      this.overallHasher.update(buf)
      if (!this.addedNewBlock && size) {
        this.addBlock(buf, size - this.totalChuck)
      }
      this.blockHasher = null
    }
    let r = this.overallHasher.digest(encoding)
    this.overallHasher = null // Make sure we can't use this object anymore.
    return r
  }
  addBlock(buf: Buffer, size: number) {
    const start = this.totalChuck,
      end = start + size
    this.totalChuck = end
    this.blocks.push({ start, end, hash: buf.toString('hex'), order: this.order })
    this.addedNewBlock = true
    this.order += 1
  }
}
export function create() {
  return new ContentHasher(crypto.createHash('sha256'), crypto.createHash('sha256'))
}
