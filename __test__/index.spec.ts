import { ensureDir, pathExists, removeSync, rename, stat, truncate } from 'fs-extra'
import { join } from 'path'

import { createBlocks, Dedupe, deduplicate, getHash, mergeBlocks, validateBlock, validateBlocks } from '../src'

const file = join(__dirname, 'file.zip'),
  output = join(__dirname, 'new-file.zip'),
  bucket = join(__dirname, 'bucket')
let fileSize: number, fileObject: Dedupe.FileDedupeObject

describe("Generate file hash and it's blocks", () => {
  beforeAll(async () => {
    await ensureDir(bucket)
  })
  it('should deduplicate the file', async done => {
    fileSize = (await stat(file)).size
    fileObject = await deduplicate(file)
    expect(fileObject).not.toBeUndefined()
    done()
  })

  it('should re-deduplicate the file and compares the output with the previous output', done => {
    deduplicate(file).then(d => {
      expect(d).toEqual(fileObject)
      done()
    })
  })
  it('should write file blocks/chunks to disk, re-hash and compare each block/chunk', async done => {
    removeSync(bucket)
    await ensureDir(bucket)
    await createBlocks({ input: file, bucket, blocks: fileObject.blocks })
    const newBlockHashs: string[] = []
    for (const block of fileObject.blocks) {
      const path = join(bucket, block.hash),
        exists = await pathExists(path),
        h = await getHash(path)
      expect(true).toEqual(exists)
      expect(block.hash).toEqual(h)
      newBlockHashs.push(h)
    }
    const blocksHash = fileObject.blocks.map(b => b.hash)
    expect(newBlockHashs).toEqual(blocksHash)
    done()
  })

  it('rerun (create blocks, re-hash and compare) without passing blocks', async done => {
    removeSync(bucket)
    await ensureDir(bucket)
    await createBlocks({ input: file, bucket })
    const newBlockHashs: string[] = []
    for (const block of fileObject.blocks) {
      const path = join(bucket, block.hash),
        exists = await pathExists(path),
        h = await getHash(path)
      expect(true).toEqual(exists)
      expect(block.hash).toEqual(h)
      newBlockHashs.push(h)
    }
    const blocksHash = fileObject.blocks.map(b => b.hash)
    expect(newBlockHashs).toEqual(blocksHash)
    done()
  })

  it('Merge file blocks back', async done => {
    const op: Dedupe.MergeOptions = {
      output,
      blocks: fileObject.blocks.map(b => ({
        start: b.start,
        end: b.end,
        bucket,
        hash: b.hash
      }))
    }
    await mergeBlocks(op)
    const newSize = (await stat(output)).size
    expect(newSize).toEqual(fileSize)
    const newBlocks = await deduplicate(output)
    expect(newBlocks).toEqual(fileObject)
    done()
  })
  it('Validate a block', async done => {
    let b = fileObject.blocks[0]
    let block = { size: b.end - b.start, hash: b.hash }
    let isValid = await validateBlock(bucket, block)
    expect(isValid).toEqual(true)
    done()
  })
  it('Validate if file blocks are truly written to bucket', async done => {
    let isValid = await validateBlocks(bucket, fileObject.blocks)
    expect(isValid).toEqual(true)
    // check for missing path
    removeSync(join(bucket, fileObject.blocks[3].hash))
    isValid = await validateBlocks(bucket, fileObject.blocks)

    expect(isValid).toEqual(false)
    // Check for block size
    await truncate(join(bucket, fileObject.blocks[2].hash))
    isValid = await validateBlocks(bucket, fileObject.blocks)
    expect(isValid).toEqual(false)
    // Check for wrong content
    await rename(join(bucket, fileObject.blocks[1].hash), join(bucket, fileObject.blocks[0].hash))
    isValid = await validateBlocks(bucket, fileObject.blocks)
    expect(isValid).toEqual(false)
    done()
  })
  it('Throw error if validateBlocks fileObject is not passed', async () => {
    await expect(validateBlocks(bucket, null)).rejects.toThrow()
  })
})
