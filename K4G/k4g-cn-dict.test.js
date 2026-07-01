const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dictPath = path.join(__dirname, 'K4G_CN.js');
const code = fs.readFileSync(dictPath, 'utf8');
const sandbox = { window: {} };

vm.runInNewContext(code, sandbox, { filename: dictPath });

const dict = sandbox.window.K4G_EXTERNAL_DICT;

assert.strictEqual(
  dict['This is not a standard product. Read important notes (1) to make sure your offer has the same restrictions.'],
  '这不是标准商品。请阅读重要说明（1），确保你的报价具有相同的限制条件。'
);
