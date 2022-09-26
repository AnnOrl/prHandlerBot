var config = require('../config.json');

const emoji = [
    '(-‿‿-)',
    '<(￣︶￣)>',
    '(*⌒―⌒*)',
    'ヽ(・∀・)ﾉ',
    '(´｡• ω •｡`)',
    '(＠＾－＾)',
    '(o^▽^o)',
    'ヽ(*・ω・)ﾉ',
    '(^人^)',
    '(o´▽`o)',
    '(*´▽`*)',
    '｡ﾟ(ﾟ^∀^ﾟ)ﾟ｡',
    '(´ω｀)',
    '(≧◡≦)',
    '(＾▽＾)',
    '(⌒ω⌒)',
    '(⌒▽⌒)☆',
    '∑d (ﾟ∀ﾟd)',
    '╰(▔∀▔)╯',
    '(─‿‿─)',
    '(*^‿^*)',
    'ヽ(o^―^o)ﾉ',
    '(✯◡✯)',
    '(◕‿◕)',
    '(*≧ω≦*)',
    '(((o (*ﾟ▽ﾟ*)o)))',
    '(⌒‿⌒)',
    '＼(≧▽≦)／',
    '⌒(o＾▽＾o)ノ',
    '(*ﾟ▽ﾟ*)',
    'ヽ(*⌒▽⌒*)ﾉ',
    '(´｡• ᵕ •｡`)',
    '(´ ▽ `)',
    '(￣▽￣)',
    '╰(*´︶`*)╯',
    'ヽ(>∀<☆)ノ',
    'o (≧▽≦)o',
    '(☆ω☆)',
    '(っ˘ω˘ς)',
    '＼(￣▽￣)／',
    '(*¯︶¯*)',
    '＼(＾▽＾)／',
    '٩(◕‿◕)۶',
    '(o˘◡˘o)',
];

const headers = {
    Authorization: `Basic ${config.auth}`,
    'X-Requested-With': 'XMLHttpRequest',
    'X-Atlassian-Token': 'nocheck',
};

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
}

module.exports = {emoji, headers, getRandomInt};