var waveheader = require('waveheader');
var fs = require('fs');

var SAMPLE_RATE = 44100;

var fileName = [0x34, 0x12];
var startAdress = [0x00, 0x18];
var endAdress = [0x20, 0x18];
var data = [0x1E];

var waveData = [];

processData();

function processData() {
    
    // Lead Sync
    console.log('Generating Lead sync');
    generateLeadSync();

    // File name
    console.log('Generating File name');
    fileName.forEach(function(el) {
        generateByte(el);
    });
    
    // Start Adress
    console.log('Generating Start adress');
    startAdress.forEach(function(el) {
        generateByte(el);
    });
    
    // End Adress
    console.log('Generating End adress');
    endAdress.forEach(function(el) {
        generateByte(el);
    });
    
    console.log('Generating Checksum');
    generateChecksum();
    
    // Mid sync
    console.log('Generating Mid sync');
    generateMidTailSync();
    
    // Actual Data
    console.log('Generating Data');
    data.forEach(function(el) {
        generateByte(el);
    });
    
    // Tail sync
    console.log('Generating Tail sync');
    generateMidTailSync();
    
}

function generateByte(byte) {
    
    byte = padByte(dec2Bin(byte));
    
    // Start Bit
    generateBit(0);
    
    for (var i = 0; i < byte.length; i++) {
        generateBit(byte[i])
    }
    
    // End Bit
    generateBit(1);
    
}

function generateChecksum() {
    
    var sum = 0;
    
    for (var i = 0; i < data.length; i++) {
        sum = (sum + data[i]) % 256;
    }
    
    generateByte(sum);

}

function generateLeadSync() {
    for (var i = 0; i < 4000; i++) {
        pushTone(1000);
    }
}

function generateMidTailSync() {
    for (var i = 0; i < 4000; i++) {
        pushTone(2000);
    }
}

function generateBit(bit) {
        
    for (var i = 0; i < (bit == 1 ? 4 : 8); i++) {
        pushTone(2000);
    }

    for (var i = 0; i < (bit == 1 ? 4 : 2); i++) {
        pushTone(1000);
    }
    
}

function pushTone(freq) {
    waveData = waveData.concat(generateWaveCycle(Math.round(SAMPLE_RATE / freq) * 2));
}

function dec2Bin(dec) {
    return parseInt(dec, 10).toString(2)
}

function padByte(byte) {
    var s = byte + '',
        needed = 8 - s.length;
        
    if (needed > 0) {
        s = (Math.pow(10, needed) + '').slice(1) + s;
    } 
    return s;
}

function generateWaveCycle(cycle, volume) {
    
    var volume = volume || 100;
    var data = [];
    var tmp;
    
    for (var i = 0; i < cycle; i++) {
        data[i] = volume * Math.sin((i / cycle) * Math.PI * 2) > 0 ? volume : 0;
    }
    
    return data;
}

console.log('Wavedata length: ' + waveData.length);

var writer = new fs.createWriteStream('output.wav');
writer.write(waveheader(waveData.length));

writer.write(new Buffer(waveData));
writer.end();