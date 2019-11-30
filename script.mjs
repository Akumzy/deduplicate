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
        console.time('URL');
        let url = URL.createObjectURL(file)
        console.timeEnd('URL');
        console.log(url);
        console.time('dedupe');
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
        console.timeEnd('dedupe');
        const text = blocks.reduce((a, { hash }) => a + hash, '')
        const msgUint8 = new TextEncoder().encode(text);
        fileHash = await hash(msgUint8)
        console.log(fileHash);
        console.log(blocks);

    }

}
/**
 * 
 * @param {number} size 
 */
 function generateBlocks (size) {
    const chunk = 524288
    const blocksSize = Math.ceil(size / chunk),
        blocks = []

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
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}