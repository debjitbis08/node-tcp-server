'use strict';

var DECODER_CONFIG = {
    prefix: 'H',
    fields: [
        {
            name: 'Slave ID',
            size: 8
        },
        {
            name: 'Function Code',
            size: 16
        },
        {
            name: 'VA',
            size: 32,
            flipped: true
        },
        {
            name: 'Watt',
            size: 32,
            flipped: true
        },
        {
            name: 'VAR',
            size: 32,
            flipped: true
        },
        {
            name: 'PF',
            size: 32,
            flipped: true
        },
        {
            name: 'VLL',
            size: 32,
            flipped: true
        },
        {
            name: 'VLN',
            size: 32,
            flipped: true
        },
        {
            name: 'A',
            size: 32,
            flipped: true
        },
        {
            name: 'F',
            size: 32,
            flipped: true
        },
        {
            name: 'Reserved',
            size: 32,
            flipped: true
        },
        {
            name: 'Interrupt',
            size: 32,
            flipped: true
        },
        {
            name: 'CRC',
            size: 16
        }
    ]
};

var patternRegExp = new RegExp('^H([\\da-fA-F]{90})$');

function decode(data) {
    var matched = data.match(patternRegExp);

    if (matched === null) {
        return null;
    }

    var values = matched[1];
    var position = 0;
    var buf = populateBuffer(values);

    return DECODER_CONFIG.fields.reduce(function(acc, field, i) {
        var value = field.size === 32 ? buf.readUInt32BE(position) :
                field.size === 16 ? buf.readUInt16BE(position) :
                field.size === 8 ? buf.readUInt8(position) : null;

        position += (field.size/8);

        if (field.flipped && field.size === 32) {
            acc[field.name] = convertToFloat(convertToDWord(value));
        } else {
            acc[field.name] = value;
        }

        return acc;
    }, {});
}

function populateBuffer(values) {
    var position = 0;
    var buf = new Buffer(90);

    while(true) {
        if (position + 8 > 90) {
            buf.writeUInt8(parseInt(values.substr(position), 16), position/2);
            break;
        }
        buf.writeUInt32BE(parseInt(values.substr(position, 8), 16), position/2);
        position += 8;
    }

    return buf;
}

function convertToDWord(value) {
    return ((value & 0xFFFF) << 16) + ((value >> 16) & 0x0000FFFF);
}

function convertToFloat(value) {
    var buf = new Buffer(4);
    buf.writeInt32BE(value, 0);
    return buf.readFloatBE(0);
}

module.exports = decode;