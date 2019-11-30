/**@type {HTMLInputElement} */
const input = document.querySelector('#file')
input.addEventListener('change', onChange, false)
/**
 * 
 * @param {InputEvent} ev 
 */
async function onChange (ev) {
    /**@type {HTMLInputElement} */
    const input = ev.target
    for (const file of input.files) {

        const blocks = generateBlocks(file.size)
        const reader = new FileReader()

        function onReadEnd () {
            return new Promise((resolve) => {
                function onloadend () {
                    reader.removeEventListener('loadend', onloadend)
                    resolve(reader.result)
                }
                reader.addEventListener('loadend', onloadend)
            });

        }
        for (let [index, block] of blocks.entries()) {
            reader.readAsArrayBuffer(file.slice(block.start, block.end))
            let result = await onReadEnd()
            blocks[index].hash = await hash(result)
        }

        fileHash = await hash(new TextEncoder().encode(blocks.reduce((a, { hash }) => a + hash, '')))

        console.log(blocks);

    }

}
/**
 * 
 * @param {number} size 
 */
function generateBlocks (size) {
    const chunk = 524288
    const blocksSize = Math.ceil(size / chunk)
    const blocks = []

    for (let index = 0; index < blocksSize; index++) {
        const start = chunk * index,
            block = {
                order: index + 1,
                start,
                end: start + chunk,
                hash: ''
            }
        if (blocksSize - 1 === index) {
            block.end = size
        }

        blocks.push(block)
    }

    return blocks
}
async function hash (buf) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}