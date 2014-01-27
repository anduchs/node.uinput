/*
 * Copyright 2013, Andreas Fuchs, Stefan Buller
 * 
 * 
 * 
 * TODOs:
 * - 
 * 
 **/

var fs = require("fs");
var LLioctl = require("LLioctl");
var CRef = require("ref");
var CArray = require("ref-array");
var CStruct = require("ref-struct");

var INPUT_H = {};
exports.INPUT_H = INPUT_H;
fs.readFileSync("/usr/include/linux/input.h", "ascii").split("\n").
    forEach(function(element) {
        var match = element.match(/^#define (\w+)_(\w+)\s+(0x[0-9A-Fa-f]+|[0-9]+).*/); 
        if (!match) return;
        var type = match[1], name = match[2], value = match[3];
        INPUT_H[type] = INPUT_H[type] || {};
        INPUT_H[type][name] = +value;
        if (parseInt(name)) {
            INPUT_H[type][type + "_" + name] = +value;
        }
    })

IOCTL_IO = function(i) {
    return (0x55<<8) | i;
}
IOCTL_IOW = function(i, size) {
    return (1<<(8+8+14)) | (0x55<<8) | i | (size<<(8+8));
}
IOCTL_IOR = function(i, size) {
    return (2<<(8+8+14)) | (0x55<<8) | i | (size<<(8+8));
}

var UINPUT_H = {};
exports.UINPUT_H = UINPUT_H;
UINPUT_H.UINPUT_IOCTL_BASE  = 'U';
UINPUT_H.UI_DEV_CREATE      = IOCTL_IO(1);
UINPUT_H.UI_DEV_DESTROY		= IOCTL_IO(2);
UINPUT_H.UI_SET_EVBIT		= IOCTL_IOW(100,4);
UINPUT_H.UI_SET_KEYBIT		= IOCTL_IOW(101,4);
UINPUT_H.UI_SET_RELBIT		= IOCTL_IOW(102,4);
UINPUT_H.UI_SET_ABSBIT		= IOCTL_IOW(103,4);
/*UINPUT_H.UI_SET_MSCBIT		_IOW(UINPUT_IOCTL_BASE, 104, int)
UINPUT_H.UI_SET_LEDBIT		_IOW(UINPUT_IOCTL_BASE, 105, int)
UINPUT_H.UI_SET_SNDBIT		_IOW(UINPUT_IOCTL_BASE, 106, int)
UINPUT_H.UI_SET_FFBIT		_IOW(UINPUT_IOCTL_BASE, 107, int)
UINPUT_H.UI_SET_PHYS		_IOW(UINPUT_IOCTL_BASE, 108, char*)
UINPUT_H.UI_SET_SWBIT		_IOW(UINPUT_IOCTL_BASE, 109, int)
UINPUT_H.UI_SET_PROPBIT		_IOW(UINPUT_IOCTL_BASE, 110, int)*/

var ABS_MAX = 0x3f;
var InputId = CStruct({
    bustype: CRef.types.uint16
  , vendor: CRef.types.uint16
  , product: CRef.types.uint16
  , version: CRef.types.uint16
});
var InputEvent = CStruct({
    timestruct: CArray('char', 16)
  , type: CRef.types.uint16
  , code: CRef.types.uint16
  , value: CRef.types.uint32
});
var UInputUserDev = CStruct({
    name: CArray('char', 80)
  , id: InputId
  , ff_max: CRef.types.uint32
  , abs_max: CArray(CRef.types.int32, ABS_MAX + 1)
  , abs_min: CArray(CRef.types.int32, ABS_MAX + 1)
  , abs_fuzz: CArray(CRef.types.int32, ABS_MAX + 1)
  , abs_flat: CArray(CRef.types.int32, ABS_MAX + 1)
});

function unmask(fd, type, name) {
    var x = UINPUT_H["UI_SET_" + type + "BIT"];
    var y = INPUT_H[type][name];

    if (x === undefined) console.error("Trying to unmask unknown type %s", type);
    if (y === undefined) console.error("Trying to unmask unknown name %s", name);
    if (x !== undefined && y !== undefined) {
        var ret = LLioctl(fd, x, y);
        if (ret < 0) {
            console.error("Error from ioctl while unmasking %s_%s", x, y);
        }
    }
}

function inject(output, type, name, value) {
    var ev = new InputEvent();
    ev['ref.buffer'].fill(0);
    ev.type = INPUT_H.EV[type];
    ev.name = INPUT_H[type][name];
    if (value != undefined) ev.value = value;
    output.write(ev.ref());
}

function Device(path) {
    if (! this instanceof Device) return new Device(path);
    this.output = fs.createWriteStream(path || "/dev/uinput", "w");
    this.obj = {};
    this.obj.syn = inject.bind({}, this.output, 'SYN', 'REPORT', 0);
}
Device.prototype = {
    produces: function(name) {
        var s = name.split("_");
        if (s.length !== 2) {
            console.error("Use names like KEY_M");
            return;
        }
        var type = s[0];
        name = s[1];
        unmask(this.output.fd, "EV", type); //Hope this is idempotent
        unmask(this.output.fd, type, name);
        this.obj["put"+name] = inject.bind({}, this.output, type, name);
    },
    create: function(name, vendor, product, version) {
        var uidev = new UInputUserDev;
        var ret;
        uidev['ref.buffer'].fill(0);
        uidev.name.buffer.write(name || '');
        uidev.id.bustype = INPUT_H.BUS.USB;
        uidev.id.vendor = vendor || 1;
        uidev.id.product = product || 1;
        uidev.id.version = version || 1;
        this.output.write(uidev.ref());
        ret = LLioctl(this.output.fd, UINPUT_H.UI_DEV_CREATE);
        if (ret < 0) console.error("Error from ioctl while creating device: %s", ret);
        return this.obj;
    },
    destroy: function() {
        var ret = LLioctl(this.output.fd, UINPUT_H.UI_DEV_DESTROY);
        if (ret < 0) console.error("Error from ioctl while destroying device");
        this.output.end();
    }
}

exports.Device = Device;
