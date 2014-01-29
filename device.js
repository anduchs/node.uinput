var ll = require("./lowlevel");
var headers = require("./headers");
var EE = require("events").EventEmitter;
var fs = require("fs");
var util = require("util");

function ignore() {};

function Device(options) {
	if (! this instanceof Device) return new Device(options);
	EE.call(this);

	this.name = options.name || "Node Device";
	this.vendor = options.vendor || 1;
	this.product = options.product || 1;
	this.version = options.version || 1;
	this.path = options.path || "/dev/uinput";
	this.timeout = options.timeout || 10;

	this.unmasking = {};
	this.setup = false;
	this.out = fs.createWriteStream(this.path);

	var unmask = function (type, name) {
		this.unmasking[type+"_"+name] = "unmasking";
		var cb = this.unmasked.bind(this, type, name);
		ll.unmask(this.out, type, name, cb);
	}.bind(this);

	this.once('setup', this.create.bind(this));

	for (TYPE in headers.INPUT_H.EV) (function (TYPE) {
		var type = TYPE.toLowerCase();
		if (TYPE === "VERSION") return;
		if (options[type] !== undefined) {
			this.out.on('open', function() {
				unmask("EV", TYPE);
				if (options[type] instanceof String) {
					unmask(TYPE, options[type]);
				} else if (options[type] instanceof Array) {
					options[type].forEach(unmask.bind({}, TYPE));
				}
			});
		}
	}).bind(this)(TYPE);
}
util.inherits(Device, EE);

Device.prototype.unmasked = function (TYPE, NAME, err) {
	if (err) {
		console.error("Error unmasking: %s", err);
		return;
	}
	delete this.unmasking[TYPE+"_"+NAME];

	if (TYPE === "EV") {
		var type = NAME.toLowerCase();
		this[type] = ll.inject.bind(this, this.out, NAME); // (name, value, cb)
	}

	var done = true;
	for (x in this.unmasking) { done = false; break; }
	if (done) {
		this.syn = ll.inject.bind(this, this.out, "SYN", "REPORT", 0); // (, cb)
		this.setup = true;
		this.emit("setup");
	}
}

Device.prototype.create = function() {
	ll.create(this.out, this.name, this.vendor, this.product, this.version, function(err) {
		if (err) {
			console.error(err);
			return;
		}
		setTimeout(function(){this.emit("ready");}.bind(this), this.timeout);
	}.bind(this));
}

module.exports = Device;
