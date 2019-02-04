var key224 = false;
var key17 = false;
var key91 = false;
var key93 = false;
var commandKey = false;

function setCommandKey(k224, k17, k91, k93) {
	commandKey = k224 || k17 || k91 || k93;
}

document.addEventListener("keydown", function(e){
	if (e.keyCode == 224) {
		key224 = true;
	}
	if (e.keyCode == 17) {
		key17 = true;
	}
	if (e.keyCode == 91) {
		key91 = true;
	}
	if (e.keyCode == 93) {
		key93 = true;
	}
	setCommandKey(key224, key17, key91, key93);
});

document.addEventListener("keyup", function(e){
	if (e.keyCode == 224) {
		key224 = false;
	}
	if (e.keyCode == 17) {
		key17 = false;
	}
	if (e.keyCode == 91) {
		key91 = false;
	}
	if (e.keyCode == 93) {
		key93 = false;
	}
	setCommandKey(key224, key17, key91, key93);
});

