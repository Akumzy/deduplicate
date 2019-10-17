'use strict'

import { createReadStream, promises, createWriteStream, existsSync, stat } from 'fs'
import { pipeline as pp } from 'stream'
import { createHash } from 'crypto'
import { promisify } from 'util'
import { join } from 'path'
export const pipeline = promisify(pp)
const statAsync = promisify(stat)
export declare namespace Dedupe {
  interface FileDedupeObject {
    blocks: Block[]
    /**Hash is made of blocks hash combined and re-hash */
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
  interface CreateBlocksOptions {
    input: string
    bucket: string
    blocks?: Block[]
  }
}
/**
 * Create an object containing the file hash and an array of
 * all the chunks object
 *
 * @param path is the absolute path of the file to deduplicate.
 * @param chunk is the size maximum size per chunk/block default: `4mb`
 * @param algorithm is the algorithm to use default: `sha256`
 */
export async function deduplicate (path: string, chunk = 4 * 1024 * 1024, algorithm = 'sha256') {
  const size = (await promises.stat(path)).size,
    blocksSize = Math.ceil(size / chunk),
    blocks: Dedupe.Block[] = []

  for (let index = 0; index < blocksSize; index++) {
    const start = chunk * index,
      block: Dedupe.Block = {
        order: index + 1,
        start,
        end: start + chunk,
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
  return { hash, blocks } as Dedupe.FileDedupeObject
}
/**
 * Deduplicate a file or use the passed blocks array to
 * write the chunk/blocks to dist.
 */
export async function createBlocks ({ input, bucket, blocks }: Dedupe.CreateBlocksOptions) {
  if (!blocks) {
    blocks = (await deduplicate(input)).blocks
  }
  for (const block of blocks) {
    const path = join(bucket, block.hash)
    await pipeline(
      createReadStream(input, { encoding: null, start: block.start, end: block.end - 1 }),
      createWriteStream(path, { encoding: null })
    )
  }
}
/**
 * Create a hash and return a file hash
 */
export async function getHash (filePath: string, option: Dedupe.GetHashOption = { algorithm: 'sha256' }) {
  const hash = createHash(option.algorithm).setEncoding('hex')
  await pipeline(createReadStream(filePath, { ...(option.readOption || {}), encoding: null }), hash)
  return hash.read() as string
}
/**
 * Merge file blocks together and write it to disk
 */
export async function mergeBlocks (op: Dedupe.MergeOptions) {
  for (const [index, block] of op.blocks.entries()) {
    const path = join(block.bucket, block.hash)
    await pipeline(
      createReadStream(path, { encoding: null }),
      createWriteStream(op.output, { flags: index === 0 ? 'w' : 'a', encoding: null })
    )
  }
}
/**
 * Check if a file based on a givens blocks truly exists
 */
export async function validateBlocks (bucket: string, fileObject: Dedupe.FileDedupeObject) {
  if (!fileObject) {
    throw new Error(`${fileObject} is required`)
  }
  for (const block of fileObject.blocks) {
    const p = join(bucket, block.hash)
    // Check if block truly exists in filesystem
    if (!(existsSync(p))) {
      return false
    }
    const size = (await statAsync(p)).size,
      blockSize = block.end - block.start
    // Check if the block size it's same
    if (blockSize !== size) {
      return false
    }
    const hash = await getHash(p)
    // Check if the block hash it's still the same
    if (hash !== block.hash) {
      return false
    }
  }
  return true
}