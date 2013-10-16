/**
 * Copyright 2013, Andreas Fuchs
 * 
 * 
 * 
 * TODOs:
 * - 
 * 
 **/

var fs = require("fs");
var LLioctl = require("LLioctl");

exports = {};
//TODO: Rework to use redefines...
//TODO: Make this a generated extra-dist file instead of parsing during runtime...
//TODO: rework to allow for exports.KEY.A etc
exports.INPUT_H = {};
fs.readFileSync("/usr/include/linux/input.h", "ascii").split("\n").
    filter(function(element) {
        return element.match(/^#define (\w+)_(\w+)\s+(0x[0-9A-Fa-f]+|[0-9]+).*/); 
    }).
    filter(function(element) {
        eval(element.replace(/^#define (\w+)_(\w+)\s+(0x[0-9A-Fa-f]+|[0-9]+).*/, "exports.INPUT_H.$1 = {};"));
        return true;
    }).
    filter(function(element) {
        //TODO: $1_$2 is a quirk for the case of KEY_1 which would end up as KEY.1 (syntax error) otherwise...
        eval(element.replace(/^#define (\w+)_(\w+)\s+(0x[0-9A-Fa-f]+|[0-9]+).*/, "exports.INPUT_H.$1.$1_$2 = $3;"));
        return false;
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

exports.UINPUT_H = {};
exports.UINPUT_H.UINPUT_IOCTL_BASE  = 'U';
exports.UINPUT_H.UI_DEV_CREATE      = IOCTL_IO(0);
exports.UINPUT_H.UI_DEV_DESTROY		= IOCTL_IO(1);
exports.UINPUT_H.UI_SET_EVBIT		= IOCTL_IOW(100,4);
exports.UINPUT_H.UI_SET_KEYBIT		= IOCTL_IOW(101,4);
exports.UINPUT_H.UI_SET_RELBIT		= IOCTL_IOW(102,4);
exports.UINPUT_H.UI_SET_ABSBIT		= IOCTL_IOW(103,4);
/*exports.UINPUT_H.UI_SET_MSCBIT		_IOW(UINPUT_IOCTL_BASE, 104, int)
exports.UINPUT_H.UI_SET_LEDBIT		_IOW(UINPUT_IOCTL_BASE, 105, int)
exports.UINPUT_H.UI_SET_SNDBIT		_IOW(UINPUT_IOCTL_BASE, 106, int)
exports.UINPUT_H.UI_SET_FFBIT		_IOW(UINPUT_IOCTL_BASE, 107, int)
exports.UINPUT_H.UI_SET_PHYS		_IOW(UINPUT_IOCTL_BASE, 108, char*)
exports.UINPUT_H.UI_SET_SWBIT		_IOW(UINPUT_IOCTL_BASE, 109, int)
exports.UINPUT_H.UI_SET_PROPBIT		_IOW(UINPUT_IOCTL_BASE, 110, int)*/



exports.createKeyboard = function () {
    fd = fs.openSync("/dev/uinput", "w");
    ret = LLioctl(fd, exports.UINPUT_H.UI_SET_EVBIT, exports.INPUT_H.EV.EV_KEY);
    
}


