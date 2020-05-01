const { deduplicate, createBlocks, mergeBlocks } = require('../dist')
const { join } = require('path')
const fs = require('fs-extra')
async function main() {
  try {
    const filePath = join(__dirname, './/home/akumzy/loki/deduplication/__test__/file.mp4')
    const ONE_MAGA_BYTES = 1024 * 1024
    const info = await deduplicate('/home/akumzy/loki/deduplication/__test__/file.mp4', ONE_MAGA_BYTES)
    await fs.writeJSON('./block.json', info)
  } catch (error) {
    console.log(error)
  }

  // console.log(info)
  // ->  {
  //     hash: 'f27a663ef8df8091e94d07ba090449a34b68461b9af5557377423057ce902484',
  //     blocks: [
  //       {
  //         order: 1,
  //         start: 0,
  //         end: 281,
  //         hash: '673c83b6fd07ba91954d4bc88f631bbe31bb9675b6c44b635801157c0ba94861'
  //       }
  //     ]
  //   }

  // const bucket = join(__dirname, 'bucket') // directory most exists
  // // write blocks to dist
  // await createBlocks({ input: filePath, bucket })
  // // -> Will create a blocks in bucket directory

  // // merge blocks back
  // const output = join(__dirname, 'new-index.js')
  // const blocks = info.blocks.map(block => ({ start: block.start, end: block.end, bucket, hash: block.hash }))
  // await mergeBlocks({ output, blocks })
  // // -> Will create a new file out of the blocks
}
main()
