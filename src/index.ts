'use strict'

import { createReadStream, promises, createWriteStream } from 'fs'
import { pipeline as pp } from 'stream'
import { createHash } from 'crypto'
import { promisify } from 'util'
import { join } from 'path'

export const pipeline = promisify(pp)
export declare namespace Deduplicate {
  interface HashObject {
    blocks: Block[]
    hash: string
  }
  interface GetHashOption {
    algorithm?: string
    readOption?: {
      start: number
      end: number
    }
  }
  interface Block {
    order: number
    start: number
    end: number
    hash: string
  }
  interface MergeOptions {
    blocks: MergeBlock[]
    output: string
  }
  interface MergeBlock {
    start: number
    end: number
    hash: string
    bucket: string
  }
}

export async function deduplicate(path: string, chuck = 4 * 1024 * 1024) {
  const size = (await promises.stat(path)).size,
    blocksSize = Math.ceil(size / chuck),
    algorithm = 'sha256',
    blocks: Deduplicate.Block[] = []

  for (let index = 0; index < blocksSize; index++) {
    const start = chuck * index,
      block: Deduplicate.Block = {
        order: index + 1,
        start,
        end: start + chuck,
        hash: ''
      }
    if (blocksSize - 1 === index) {
      block.end = size
    }
    block.hash = await getHash(path, { readOption: { start: block.start, end: block.end - 1 }, algorithm })
    blocks.push(block)
  }

  const hash = createHash(algorithm)
    .update(Buffer.from(blocks.map(b => b.hash).join('')))
    .digest('hex')
  return { hash, blocks } as Deduplicate.HashObject
}

export async function getHash(filePath: string, option: Deduplicate.GetHashOption = { algorithm: 'sha256' }) {
  if (!option) {
    throw new Error('here')
  }
  const hash = createHash(option.algorithm).setEncoding('hex')
  await pipeline(createReadStream(filePath, { ...(option.readOption || {}), encoding: null }), hash)
  return hash.read() as string
}

export async function mergeBlocks(op: Deduplicate.MergeOptions) {
  for (const [index, block] of op.blocks.entries()) {
    const path = join(block.bucket, block.hash)
    await pipeline(
      createReadStream(path, { encoding: null }),
      createWriteStream(op.output, { flags: index === 0 ? 'w' : 'a', encoding: null })
    )
  }
}
