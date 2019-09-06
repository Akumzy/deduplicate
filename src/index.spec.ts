import { createBlocks } from '.'
import { join } from 'path'
const result = {
  hash: 'f6dc724d119649460e47ce719139e521e082be8a9755c5bece181de046ee65fe',
  blocks: [
    {
      start: 0,
      end: 11,
      hash: '64ec88ca00b268e5ba1a35678a1b5316d212f4f366b2477232534a8aeca37f3c',
      order: 0
    }
  ]
}
describe("Generate file hash and it's blocks", () => {
  test('create file hash and blocks', done => {
    createBlocks(join(__dirname, './file.txt'), 11).then(d => {
      expect(d).toEqual(result)
      done()
    })
  })
  test('return undefined when size is not passed', done => {
    createBlocks(join(__dirname, './file.txt'), null).then(d => {
      expect(d).toBeUndefined()
      done()
    })
  })
})
