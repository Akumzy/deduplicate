'use strict';
exports.__esModule = true;
var crypto_1 = require("crypto");
var assert_1 = require("assert");
var BLOCK_SIZE = 4 * 1024 * 1024;
var ContentHasher = /** @class */ (function () {
    function ContentHasher(overallHasher, blockHasher) {
        var _this = this;
        this.update = function (data) {
            if (_this.overallHasher === null) {
                throw new assert_1.AssertionError({
                    message: "can't use this object anymore; you already called digest()"
                });
            }
            var offset = 0;
            while (offset < data.length && _this.blockHasher) {
                if (_this.blockPos === BLOCK_SIZE) {
                    var buf = _this.blockHasher.digest();
                    _this.overallHasher.update(buf);
                    _this.addBlock(buf, BLOCK_SIZE);
                    _this.blockHasher = crypto_1["default"].createHash('sha256');
                    _this.blockPos = 0;
                }
                var spaceInBlock = BLOCK_SIZE - _this.blockPos, inputPartEnd = Math.min(data.length, offset + spaceInBlock), inputPartLength = inputPartEnd - offset;
                _this.blockHasher.update(data.slice(offset, inputPartEnd));
                _this.blockPos += inputPartLength;
                offset = inputPartEnd;
            }
        };
        this.digest = function (encoding, size) {
            if (_this.overallHasher === null) {
                throw new assert_1.AssertionError({
                    message: "can't use this object anymore; you already called digest()"
                });
            }
            if (_this.blockPos > 0 && _this.blockHasher) {
                var buf = _this.blockHasher.digest();
                _this.overallHasher.update(buf);
                if (!_this.addedNewBlock && size) {
                    _this.addBlock(buf, size - _this.totalChuck);
                }
                _this.blockHasher = null;
            }
            var r = _this.overallHasher.digest(encoding);
            _this.overallHasher = null; // Make sure we can't use this object anymore.
            return r;
        };
        this.overallHasher = overallHasher;
        this.blockHasher = blockHasher;
        this.blockPos = 0;
        this.blocks = [];
        this.totalChuck = 0;
        this.addedNewBlock = false;
        this.order = 0;
    }
    ContentHasher.prototype.addBlock = function (buf, size) {
        var start = this.totalChuck, end = start + size;
        this.totalChuck = end;
        this.blocks.push({ start: start, end: end, hash: buf.toString('hex'), order: this.order });
        this.addedNewBlock = true;
        this.order += 1;
    };
    return ContentHasher;
}());
function create() {
    return new ContentHasher(crypto_1["default"].createHash('sha256'), crypto_1["default"].createHash('sha256'));
}
exports.create = create;
