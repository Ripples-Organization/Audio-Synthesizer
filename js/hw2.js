/******************************
VARIABLES
******************************/
var hw2 = {};
hw2.context = new webkitAudioContext();
hw2.filters = new filters(hw2.context, "filters");
hw2.generator1 = new generator(hw2.context, "gen1", hw2.filters);
hw2.generator2 = new generator(hw2.context, "gen2", hw2.filters);
hw2.generator3 = new generator(hw2.context, "gen3", hw2.filters);
hw2.keyboard = new keyboard(hw2.context, hw2.generator1, hw2.generator2, hw2.generator3);
// the onscreen keyboard "ASCII-key-to-MIDI-note" conversion array
hw2.keys = new Array( 256 );
hw2.keys[65] = hw2.keys[97] = 60; // = C4 ("middle C")
hw2.keys[87] = hw2.keys[119] = 61;
hw2.keys[83] = hw2.keys[115] = 62;
hw2.keys[69] = hw2.keys[101] = 63;
hw2.keys[68] = hw2.keys[100] = 64;
hw2.keys[70] = hw2.keys[102] = 65; // = F4
hw2.keys[84] = hw2.keys[116] = 66;
hw2.keys[71] = hw2.keys[103] = 67;
hw2.keys[89] = hw2.keys[121] = 68;
hw2.keys[72] = hw2.keys[104] = 69;
hw2.keys[85] = hw2.keys[117] = 70;
hw2.keys[74] = hw2.keys[106] = 71;
hw2.keys[75] = hw2.keys[107] = 72; // = C5
hw2.keys[79] = hw2.keys[111] = 73;
hw2.keys[76] = hw2.keys[108] = 74;
hw2.keys[80] = hw2.keys[112] = 75;
hw2.keys[59] = hw2.keys[186] = 76;
hw2.keys[39] = hw2.keys[222] = 77; // = F5
hw2.keys[93] = hw2.keys[221] = 78;
hw2.keys[13] = 79;
hw2.keys[92] = hw2.keys[220] = 80;

/******************************
CONSTRUCTORS
******************************/
function generator(ctx, id, fltrs) {

	/* Instances */
	var htmlID = id;
	var context = ctx;
	var filters = fltrs;
	var oscillator = context.createOscillator();
	var noiseBufferNode = context.createBufferSource();
	var ringBufferNode = context.createBufferSource();
	var isNoiseOn = false;
	var isRingOn = false;
	var gainADSR = context.createGainNode();
	var frequency = oscillator.frequency.value;
	var waveform = 0;
	var attack = 0.3;
	var decay = 0.3;
	var sustain = 0.3;
	var release = 0.3;
	var switchState = "Off";
	var waveformText = "Sine";

	/* Getters and Setters */
	this.getHtmlID = function() {
		return htmlID;
	}
	this.getContext = function() {
		return context;
	}
	this.setContext = function(ctx) {
		context = ctx;
	}
	this.getOscillator = function() {
		return oscillator;
	}
	this.setOscillator = function(osci) {
		oscillator = osci;
	}
	this.getFrequency = function() {
		return frequency;
	}
	this.setFrequency = function(freq) {
		frequency = freq;
	}
	this.getWaveform = function() {
		return waveform;
	}
	this.setWaveform = function(wf) {
		waveform = wf;

		isNoiseOn = false;
	}
	this.getNoiseBufferNode = function() {
		return noiseBufferNode;
	}
	this.setNoiseBufferNode = function(nBufNode) {
		noiseBufferNode = nBufNode;
	}
	this.getRingBufferNode = function() {
		return ringBufferNode;
	}
	this.setRingBufferNode = function(rBufNode) {
		ringBufferNode = rBufNode;
	}
	this.getGainADSR = function() {
		return gainADSR;
	}
	this.setGainADSR = function(gain) {
		gainADSR = gain;
	}
	this.getAttack = function() {
		return attack;
	}
	this.setAttack = function(atk) {
		attack = parseFloat(atk);
		$("#"+htmlID).find(".attackText").text( atk );
	}
	this.getDecay = function() {
		return decay;
	}
	this.setDecay = function(dcy) {
		decay = parseFloat(dcy);
		$("#"+htmlID).find(".decayText").text( dcy );
	}
	this.getSustain = function() {
		return sustain;
	}
	this.setSustain = function(stn) {
		sustain = parseFloat(stn);
		$("#"+htmlID).find(".sustainText").text( stn );
	}
	this.getRelease = function() {
		return release;
	}
	this.setRelease = function(rls) {
		release = parseFloat(rls);
		$("#"+htmlID).find(".releaseText").text( rls );
	}

	/* Functions */
	this.play = function() {
		if (switchState == "Off") {
			return;
		}
		this.setupFrequency();
		this.setupWaveform();
		this.setupAdsr();
		this.setupFilters();

		if (isRingOn) {
			this.setupRingBufferNode(frequency);
			this.disconnect();
			this.connect();
			ringBufferNode.start(0);
		} else if (isNoiseOn) {
			this.setupNoiseBufferNode(frequency*4);
			this.disconnect();
			this.connect();
			noiseBufferNode.start(0);
		} else {
			this.disconnect();
			this.connect();
			oscillator.start(0);
		}
	}
	this.soundOn = function() {
		this.connect();
		switchState = "On";
		$("#"+htmlID).find(".switchText").text( switchState );
	}
	this.soundOff = function() {
		this.disconnect();
		switchState = "Off";
		$("#"+htmlID).find(".switchText").text( switchState );
	}
	this.connect = function() {
		// this node represents the final node from Generator which will connect to filters, which will connect to context.destination
		var toFilterNode = gainADSR;

		if (!isRingOn) {
			if (!isNoiseOn) {
				oscillator.connect(toFilterNode);
			} else {
				noiseBufferNode.connect(toFilterNode);
			}
		} else {
			ringBufferNode.connect(toFilterNode);
		}

		toFilterNode.connect(filters.getStartNode());
		filters.connectAll(context.destination);
	}
	this.disconnect = function() {
		oscillator.disconnect();
		noiseBufferNode.disconnect();
		ringBufferNode.disconnect();
		gainADSR.disconnect();
		filters.disconnectAll();
	}
	this.noiseSwitch = function(bool) {
		isNoiseOn = bool;
	}
	this.ringSwitch = function(bool) {
		isRingOn = bool;

		if (isRingOn) {
			$("#"+htmlID).find(".ringText").text( "On" );
		} else {
			$("#"+htmlID).find(".ringText").text( "Off" );
		}
	}
	this.setupWaveform = function() {
		oscillator.type = waveform;
	}
	this.setupFrequency = function() {
		oscillator.frequency.value = frequency;
	}
	this.interpolateArray = function(startIndex, endIndex, array) {
		if (endIndex <= startIndex) {
			console.log("Method interpolateArray ended abruptly: endIndex <= startIndex;")
			return;
		}

		var length = endIndex - startIndex;
		var difference = array[endIndex] - array[startIndex];
		var increment = difference / length;

		for (var i = 1; i < length; i++) {
			array[startIndex + i] = array[startIndex] + increment * i;
		}
	}
	this.generateNoiseArray = function(length, freq, sampleFreq) {
		var noiseBufferArray = [];
		var intervalArray = [];
		var interval = sampleFreq / freq;
		var count = interval;

		for (var i = 0; i < length; i++) {
			if (count==interval) {
				noiseBufferArray[i] = (Math.random()*2)-1;
				intervalArray.push(i);
			} else {
				noiseBufferArray[i] = 0;
			}
			
			count--;

			if(count < 0) {
				count = interval;
			}
		}

		noiseBufferArray[noiseBufferArray.length-1] = noiseBufferArray[0];

		for (var i = 1; i < intervalArray.length; i ++) {
			this.interpolateArray(intervalArray[i-1], intervalArray[i], noiseBufferArray);
		}
		this.interpolateArray(intervalArray[intervalArray.length - 1], noiseBufferArray.length-1, noiseBufferArray);

		return noiseBufferArray;
	}
	this.generateNoiseBuffer = function(freq) {
		var noiseBufferObj = context.createBuffer(1, 44100, 44100);
		var noiseBufferArr = this.generateNoiseArray(noiseBufferObj.length, freq, noiseBufferObj.sampleRate);
		noiseBufferObj.getChannelData(0).set(noiseBufferArr);

		return noiseBufferObj;
	}
	this.setupNoiseBufferNode = function(freq) {
		noiseBufferNode.buffer = this.generateNoiseBuffer(freq);
		noiseBufferNode.loop = true;
	}
	this.playNoise = function() {
		this.setupNoiseBufferNode(frequency);
		noiseBufferNode.connect(context.destination);
		noiseBufferNode.start(0);
	}
	this.stopNoise = function() {
		noiseBufferNode.disconnect();
	}
	this.generateRingArray = function(length) {
		var square = new Array(length);
		var triangle = new Array(length);
		var midPoint = parseInt(length / 2);
		var quarterPoint = parseInt(length / 4);
		var threeQuarterPoint = parseInt(length * 3 / 4);
		var endPoint = length - 1;

		// SquareWave
		for (var i = 0; i < midPoint; i++) {
			square[i] = 1;
		}
		for (var i = midPoint; i < length; i++) {
			square[i] = -1;
		}
		

		// TriangleWave
		triangle[0] = 0;
		triangle[quarterPoint] = 1;
		triangle[threeQuarterPoint] = -1;
		triangle[endPoint] = 0;
		this.interpolateArray(0, quarterPoint, triangle);
		this.interpolateArray(quarterPoint, threeQuarterPoint, triangle);
		this.interpolateArray(threeQuarterPoint, endPoint, triangle);

		// Multiply each other
		for (var i = 0; i < length; i++) {
			triangle[i] *= square[i];
		}

		return triangle;
	}
	this.generateRingBuffer = function(freq) {
		var sampleFreq = 44100;
		var length = parseInt(sampleFreq / freq);

		var ringBufferObj = context.createBuffer(1, length, sampleFreq);
		var ringBufferArr = this.generateRingArray(ringBufferObj.length);

		ringBufferObj.getChannelData(0).set(ringBufferArr);

		return ringBufferObj;

	}
	this.setupRingBufferNode = function(freq) {
		ringBufferNode.buffer = this.generateRingBuffer(freq);
		ringBufferNode.loop = true;
	}
	this.playRing = function() {
		this.setupRingBufferNode(frequency);
		ringBufferNode.connect(context.destination);
		ringBufferNode.start(0);
	}
	this.stopRing = function() {
		ringBufferNode.disconnect();
	}
	this.setupAdsr = function() {
		var now = context.currentTime;
		gainADSR.gain.setValueAtTime(0, now);

		this.setupAttack(now);
		this.setupDecay(now);
		this.setupSustain(now);
		this.setupRelease(now);
	}
	this.setupAttack = function(now) {
        gainADSR.gain.linearRampToValueAtTime(1.0, now + attack);
	}
	this.setupDecay = function(now) {
		gainADSR.gain.linearRampToValueAtTime(0.6, now + attack + decay);
	}
	this.setupSustain = function(now) {
		gainADSR.gain.linearRampToValueAtTime(0.6, now + attack + decay + sustain);
	}
	this.setupRelease = function(now) {
		gainADSR.gain.linearRampToValueAtTime(0.0, now + attack + decay + sustain + release);
	}
	this.setupFilters = function() {
		filters.setupAll();
	}

	/* Events */
	$("#"+htmlID).find(".wfType")
	.click( function() {
		waveformText = $(this).text();
		$("#"+htmlID).find(".waveformText").text( waveformText );
	});
	$("#"+htmlID)
	.ready( function() {
		$(".switchText").text(switchState);
		$(".waveformText").text(waveformText);
		$(".attackText").text(attack);
		$(".decayText").text(decay);
		$(".sustainText").text(sustain);
		$(".releaseText").text(release);
	});

}

function filters(ctx, id) {

	/* Instances */
	var context = ctx;
	var htmlID = id;
	var lowPassFilter = context.createBiquadFilter();
	var highPassFilter = context.createBiquadFilter();
	var bandPassFilter = context.createBiquadFilter();
	var isLowPassOn = false;
	var isHighPassOn = false;
	var isBandPassOn = false;
	var volumeNode = context.createGainNode();
	var startNode = volumeNode;
	var lpFreq = 300;
	var hpFreq = 300;
	var bpFreq = 300;
	var volume = .5;

	/* Getters and Setters */
	this.getContext = function() {
		return context;
	}
	this.setContext = function(ctx) {
		context = ctx;
	}
	this.getHtmlID = function() {
		return htmlID;
	}
	this.setHtmlID = function(id) {
		htmlID = id;
	}
	this.getLowPassFilter = function() {
		return lowPassFilter;
	}
	this.setLowPassFilter = function(filter) {
		lowPassFilter = filter;
	}
	this.getHighPassFilter = function() {
		return highPassFilter;
	}
	this.setHighPassFilter = function(filter) {
		highPassFilter = filter;
	}
	this.getBandPassFilter = function() {
		return bandPassFilter;
	}
	this.setBandPassFilter = function(filter) {
		bandPassFilter = filter;
	}
	this.getVolumeNode = function() {
		return volumeNode;
	}
	this.setVolumeNode = function(volNode) {
		volumeNode = volNode;
	}
	this.lowPassSwitch = function(bool) {
		isLowPassOn = bool;
		
		if (isLowPassOn) {
			$("#"+htmlID).find(".lowpassSwitchText").text( "On" );
		} else {
			$("#"+htmlID).find(".lowpassSwitchText").text( "Off" );
		}
	}
	this.highPassSwitch = function(bool) {
		isHighPassOn = bool;

		if (isHighPassOn) {
			$("#"+htmlID).find(".highpassSwitchText").text( "On" );
		} else {
			$("#"+htmlID).find(".highpassSwitchText").text( "Off" );
		}
	}
	this.bandPassSwitch = function(bool) {
		isBandPassOn = bool;

		if (isBandPassOn) {
			$("#"+htmlID).find(".bandpassSwitchText").text( "On" );
		} else {
			$("#"+htmlID).find(".bandpassSwitchText").text( "Off" );
		}
	}
	this.getLpFreq = function() {
		return lpFreq;
	}
	this.setLpFreq = function(freq) {
		lpFreq = freq;

		$("#"+htmlID).find(".lowpassText").text( freq );
	}
	this.getHpFreq = function() {
		return hpFreq;
	}
	this.setHpFreq = function(freq) {
		hpFreq = freq;

		$("#"+htmlID).find(".highpassText").text( freq );
	}
	this.getBpFreq = function() {
		return bpFreq;
	}
	this.setBpFreq = function(freq) {
		bpFreq = freq;

		$("#"+htmlID).find(".bandpassText").text( freq );
	}
	this.getVolume = function() {
		return volume;
	}
	this.setVolume = function(vol) {
		volume = vol;

		$("#"+htmlID).find(".volumeText").text( vol );
	}
	this.getStartNode = function() {
		return startNode;
	}

	/* Functions */
	this.setupVolume = function() {
		volumeNode.gain.value = volume;
	}
	this.setupLowPassFilter = function() {
		lowPassFilter.type = lowPassFilter.LOWPASS;
		lowPassFilter.frequency.value = lpFreq;
	}
	this.setupHighPassFilter = function() {
		highPassFilter.type = highPassFilter.HIGHPASS;
		highPassFilter.frequency.value = hpFreq;
	}
	this.setupBandPassFilter = function() {
		bandPassFilter.type = bandPassFilter.BANDPASS;
		bandPassFilter.frequency.value = bpFreq;
	}
	this.setupAll = function() {
		this.setupLowPassFilter();
		this.setupHighPassFilter();
		this.setupBandPassFilter();
		this.setupVolume();
	}
	this.connectAll = function(endNode) {
		var headNode = volumeNode;
		
		volumeNode.connect(endNode);

		if (isBandPassOn) {
			bandPassFilter.connect(headNode);
			headNode = bandPassFilter;
		}
		if (isHighPassOn) {
			highPassFilter.connect(headNode);
			headNode = highPassFilter;
		}
		if (isLowPassOn) {
			lowPassFilter.connect(headNode);
			headNode = lowPassFilter;
		}

		startNode = headNode;
		
	}
	this.disconnectAll = function() {
		lowPassFilter.disconnect();
		highPassFilter.disconnect();
		bandPassFilter.disconnect();
		volumeNode.disconnect();
	}

	/* Events */
	$("#"+htmlID)
	.ready( function() {
		$(".lowpassText").text(lpFreq);
		$(".highpassText").text(hpFreq);
		$(".bandpassText").text(bpFreq);
		$(".volumeText").text(volume);
	});
}

function keyboard(context, gen1, gen2, gen3) {
	
	/* Instances */
	var frequency = 0;

	/* Getters and Setters */
	this.getFrequency = function() {
		return frequency;
	}
	this.setFrequency = function(freq) {
		frequency = freq;
	}

	/* Functions */
	this.frequencyFromNote = function(note) {
		return 440 * Math.pow(2,(note-69)/12);
	}
	this.pressNote = function(note) {
		var key = $("#k"+note);
		key.addClass("pressed");

		frequency = this.frequencyFromNote(note);

		this.setupFrequency();
		this.play();
	}
	this.releaseNote = function(note) {
		var key = $("#k"+note);
		key.removeClass("pressed");
	}
	this.setupFrequency = function() {
		gen1.setFrequency(frequency);
		gen2.setFrequency(frequency);
		gen3.setFrequency(frequency);
	}
	this.play = function() {
		gen1.play();
		gen2.play();
		gen3.play();
	}

}

/******************************
FUNCTIONS
******************************/


/******************************
EVENTS
******************************/

// Mouse Events for Keys
$("#keybox").find(".key")
.mousedown( function() {
	var id = parseInt( this.id.substring(1) );
	hw2.keyboard.pressNote(id);
})
.mouseup( function() {
	var id = parseInt( this.id.substring(1) );
	hw2.keyboard.releaseNote(id);
});

// Keyboard buttons for Keys
$(document)
.keypress( function(e) {
	if (hw2.keys[e.keyCode] != null) {
		hw2.keyboard.pressNote( hw2.keys[e.keyCode] );
	}
})
.keyup( function(e) {
	hw2.keyboard.releaseNote( hw2.keys[e.keyCode] );
});

// Page onLoad
$(document)
.ready( function() {
	hw2.generator1.soundOn();
	hw2.generator2.soundOn();
	hw2.generator3.soundOn();
	hw2.generator1.ringSwitch(false);
	hw2.generator2.ringSwitch(false);
	hw2.generator3.ringSwitch(false);
	hw2.filters.lowPassSwitch(false);
	hw2.filters.highPassSwitch(false);
	hw2.filters.bandPassSwitch(false);
});