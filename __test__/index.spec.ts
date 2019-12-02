import {
  Dedupe,
  deduplicate,
  mergeBlocks,
  getHash,
  createBlocks,
  validateBlocks,
  validateBlock
} from "../src";
import {
  stat,
  ensureDir,
  pathExists,
  truncate,
  rename,
  removeSync
} from "fs-extra";
import { join } from "path";
const file = join(__dirname, "file.zip"),
  output = join(__dirname, "new-file.zip"),
  bucket = join(__dirname, "bucket");
let fileSize: number, blocks: Dedupe.FileDedupeObject;

describe("Generate file hash and it's blocks", () => {
  beforeAll(async () => {
    await ensureDir(bucket);
  });
  it("should deduplicate the file", async done => {
    fileSize = (await stat(file)).size;
    blocks = await deduplicate(file);
    expect(blocks).not.toBeUndefined();
    done();
  });

  it("should re-deduplicate the file and compares the output with the previous output", done => {
    deduplicate(file).then(d => {
      expect(d).toEqual(blocks);
      done();
    });
  });
  it("should write file blocks/chunks to disk, re-hash and compare each block/chunk", async done => {
    removeSync(bucket);
    await ensureDir(bucket);
    await createBlocks({ input: file, bucket, blocks: blocks.blocks });
    const newBlockHashs: string[] = [];
    for (const block of blocks.blocks) {
      const path = join(bucket, block.hash),
        exists = await pathExists(path),
        h = await getHash(path);
      expect(true).toEqual(exists);
      expect(block.hash).toEqual(h);
      newBlockHashs.push(h);
    }
    const blocksHash = blocks.blocks.map(b => b.hash);
    expect(newBlockHashs).toEqual(blocksHash);
    done();
  });

  it("rerun (create blocks, re-hash and compare) without passing blocks", async done => {
    removeSync(bucket);
    await ensureDir(bucket);
    await createBlocks({ input: file, bucket });
    const newBlockHashs: string[] = [];
    for (const block of blocks.blocks) {
      const path = join(bucket, block.hash),
        exists = await pathExists(path),
        h = await getHash(path);
      expect(true).toEqual(exists);
      expect(block.hash).toEqual(h);
      newBlockHashs.push(h);
    }
    const blocksHash = blocks.blocks.map(b => b.hash);
    expect(newBlockHashs).toEqual(blocksHash);
    done();
  });

  it("Merge file blocks back", async done => {
    const op: Dedupe.MergeOptions = {
      output,
      blocks: blocks.blocks.map(b => ({
        start: b.start,
        end: b.end,
        bucket,
        hash: b.hash
      }))
    };
    await mergeBlocks(op);
    const newSize = (await stat(output)).size;
    expect(newSize).toEqual(fileSize);
    const newBlocks = await deduplicate(output);
    expect(newBlocks).toEqual(blocks);
    done();
  });
  it("Validate a block", async done => {
    let b = blocks.blocks[0];
    let block = { size: b.end - b.start, hash: b.hash };
    let isValid = await validateBlock(bucket, block);
    expect(isValid).toEqual(true);
    done();
  });
  it("Validate if file blocks are truly written to bucket", async done => {
    let isValid = await validateBlocks(bucket, blocks);
    expect(isValid).toEqual(true);
    // check for missing path
    removeSync(join(bucket, blocks.blocks[3].hash));
    isValid = await validateBlocks(bucket, blocks);

    expect(isValid).toEqual(false);
    // Check for block size
    await truncate(join(bucket, blocks.blocks[2].hash));
    isValid = await validateBlocks(bucket, blocks);
    expect(isValid).toEqual(false);
    // Check for wrong content
    await rename(
      join(bucket, blocks.blocks[1].hash),
      join(bucket, blocks.blocks[0].hash)
    );
    isValid = await validateBlocks(bucket, blocks);
    expect(isValid).toEqual(false);
    done();
  });
  it("Throw error if validateBlocks fileObject is not passed", async () => {
    await expect(validateBlocks(bucket, null)).rejects.toThrow();
  });
});
