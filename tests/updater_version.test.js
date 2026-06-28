// TDD-тест чистой логики авто-апдейтера (парс ASSET_VER + решение об обновлении).
// Запуск: node tests/updater_version.test.js
const assert = require('node:assert');
const { Updater } = require('../src/updater.js');

let n = 0;
const ok = (label, cond) => { assert.strictEqual(cond, true, label); n++; };

// --- _parseVer: вытащить число версии из текста index.html ---
ok('парсит одинарные кавычки', Updater._parseVer("var ASSET_VER = '229';") === 229);
ok('парсит двойные кавычки', Updater._parseVer('ASSET_VER="230"') === 230);
ok('терпит пробелы', Updater._parseVer("ASSET_VER   =   '231'") === 231);
ok('null когда версии нет', Updater._parseVer('no version here') === null);
ok('null на пустой строке', Updater._parseVer('') === null);

// --- _shouldUpdate(html, localVer): обновляться ли ---
ok('новее → да', Updater._shouldUpdate("ASSET_VER = '230'", 229) === true);
ok('та же версия → нет (защита от петли)', Updater._shouldUpdate("ASSET_VER = '229'", 229) === false);
ok('старее → нет', Updater._shouldUpdate("ASSET_VER = '228'", 229) === false);
ok('непарсимый html → нет', Updater._shouldUpdate('garbage', 229) === false);
ok('пустой html → нет', Updater._shouldUpdate('', 229) === false);

console.log(`all ${n} updater version tests passed`);
