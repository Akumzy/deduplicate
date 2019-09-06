'use strict';
exports.__esModule = true;
var fs_1 = require("fs");
var content_hasher_1 = require("./content-hasher");
function createBlocks(filePath, size) {
    return new Promise(function (resolve, reject) {
        if (!size)
            return resolve();
        var hasher = content_hasher_1.create(), f = fs_1.createReadStream(filePath);
        f.on('data', hasher.update);
        f.on('end', function (err) {
            var hash = hasher.digest('hex', size);
            if (err)
                return reject(err);
            resolve({ hash: hash, blocks: hasher.blocks });
            f.close();
        });
        f.on('error', function (err) {
            console.log('Hash error: ', err);
            reject(err);
        });
    });
}
exports.createBlocks = createBlocks;
exports["default"] = createBlocks;
