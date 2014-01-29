var uinput = require('./uinput');
var fs = require('fs');

var tasks = [];
function seq(fn) {
	var args = [].slice.call(arguments, 1);
	tasks.push({fn:fn, args:args});
}
function next() {
	var task = tasks.shift();
	task.fn.apply({}, task.args)
}

var out = fs.createWriteStream("/dev/uinput", "w");

seq(uinput.unmask, out, "EV", "KEY", next);
seq(uinput.unmask, out, "KEY", "M", next);
seq(uinput.create, out, "test", 1, 1, 1, next);
seq(setTimeout, next, 10);
seq(uinput.inject, out, "KEY", "M", 1, next);
seq(uinput.inject, out, "SYN", "REPORT", 0, next);
seq(uinput.inject, out, "KEY", "M", 0, next);
seq(uinput.inject, out, "SYN", "REPORT", 0, next);
seq(function() {out.end();});

out.on("open", next);
