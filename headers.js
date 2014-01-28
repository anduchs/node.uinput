/*
 * Copyright 2013, Andreas Fuchs, Stefan Buller
 * 
 **/

var fs = require("fs");

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

function IOCTL_IO(i) {
    return (0x55<<8) | i;
}
function IOCTL_IOW(i, size) {
    return (1<<(8+8+14)) | (0x55<<8) | i | (size<<(8+8));
}
function IOCTL_IOR(i, size) {
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
