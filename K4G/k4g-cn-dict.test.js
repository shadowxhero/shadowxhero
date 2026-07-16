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

assert.strictEqual(
  dict["Please note that this is AN ACCOUNT, NOT A CD KEY. You'll receive a username and password to access the account with the assigned product, as well as all the details needed to change the password and the email of this account. Keep in mind that changing the account region, currency or adding a different payment method may result in an automatic account lock due to platform term of service. Due to Steam Terms of Service, sharing the library or Steam Families may not work for all countries. Read more information"],
  '请注意，这是一个账号，而非 CD 密钥。你将收到用于访问含指定产品账号的用户名和密码，以及更改该账号密码和电子邮箱所需的全部信息。请注意，更改账号地区、货币或添加其他付款方式可能会因平台服务条款而导致账号被自动锁定。根据 Steam 服务条款，共享游戏库或使用 Steam 家庭功能可能无法在所有国家/地区正常使用。阅读更多信息'
);
