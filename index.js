var waveheader = require('waveheader');
var wav = require('wav');
var Speaker = require('speaker');
var fs = require('fs');

var SAMPLE_RATE = 44100;
var FREQ_1K = 1000;
var FREQ_2K = 2000;

var fileName = '1234';
var startAdress = '1800';
var endAdress = '1825';
var data = 'DD212018CDFE05FE1320F9760000000000000000000000000000000000000000AEB51F858F37';

var waveData = [];

processData();

function processData() {
    
    // Lead Sync
    console.log('Generating Lead sync');
    generateLeadSync();

    // File name
    console.log('Generating File name');
    hexStrToWord(fileName).forEach(function(byte) {
        writeByte(byte);
    });
    
    // Start Adress
    console.log('Generating Start adress');
    hexStrToWord(startAdress).forEach(function(byte) {
        writeByte(byte);
    });
    
    // End Adress
    console.log('Generating End adress');
    hexStrToWord(endAdress).forEach(function(byte) {
        writeByte(byte);
    });
    
    console.log('Generating Checksum');
    generateChecksum();
    
    // Mid sync
    console.log('Generating Mid sync');
    generateMidTailSync();
    
    // Actual Data
    console.log('Generating Data');
    hexStrToBytes(data).forEach(function(byte) {
        writeByte(byte);
    });
    
    // Tail sync
    console.log('Generating Tail sync');
    generateMidTailSync();
    
}

function writeByte(byte) {

    byte = padByte(dec2Bin(byte)).split('').reverse().join('');
    
    // Start Bit
    writeBit(0);
    
    for (var i = 0; i < byte.length; i++) {
        writeBit(byte[i]);
    }
    
    // End Bit
    writeBit(1);
    
}

function generateChecksum() {
    
    var sum = 0;
	
	var dataBuffer = hexStrToBytes(data);
    
    for (var i = 0; i < dataBuffer.length; i++) {
        sum = (sum + dataBuffer[i]) % 256;
    }
	
    writeByte(sum);

}

function generateLeadSync() {
    for (var i = 0; i < 4000; i++) {
        pushTone(FREQ_1K);
    }
}

function generateMidTailSync() {
    for (var i = 0; i < 4000; i++) {
        pushTone(FREQ_2K);
    }
}

function writeBit(bit) {
        
    for (var i = 0; i < (bit == 1 ? 4 : 8); i++) {
        pushTone(FREQ_2K);
    }

    for (var i = 0; i < (bit == 1 ? 4 : 2); i++) {
        pushTone(FREQ_1K);
    }
    
}

function pushTone(freq) {
	
	var samplesLength = Math.round(SAMPLE_RATE / freq) * 2;
	var samples = generateWaveCycle(samplesLength);
	
	for (var i = 0; i < samples.length; i++) {
		waveData.push(samples[i]);
	}
	
}

function dec2Bin(dec) {
    return parseInt(dec, 10).toString(2)
}

function padByte(byte) {
	return byte.length > 8 ? byte : Array(8 - byte.length + 1).join('0') + byte;
}

function hexStrToBytes(hex) {
	
    if (hex.length % 2 === 1) {
		throw new Error('Odd number of characters...');
	}
	
    if (hex.indexOf('0x') === 0) {
		hex = hex.slice(2);
	}
	
    return hex.match(/../g).map(function(x) {
		return parseInt(x,16);
	});
	
}

function hexStrToWord(input) {
	return hexStrToBytes('' + input).reverse();
}

function generateWaveCycle(cycle) {
    
    var data = [];
    
    for (var i = 0; i < cycle; i++) {
        data[i] = Math.sin((i / cycle) * Math.PI * 2) > 0 ? 127 : -128;
    }
    
    return data;
}

console.log('Wavedata length: ' + waveData.length);

var writer = new fs.createWriteStream('output.wav');
writer.write(waveheader(waveData.length));

writer.write(new Buffer(waveData));
writer.end();

// Play wav

var file = fs.createReadStream('output.wav');
var reader = new wav.Reader();

reader.on('format', function(format) {
	reader.pipe(new Speaker(format));
});

file.pipe(reader);