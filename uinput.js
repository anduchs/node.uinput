/*
 * Copyright 2013, Andreas Fuchs, Stefan Buller
 * 
 **/

var LLioctl = require("LLioctl");
var CRef = require("ref");
var CArray = require("ref-array");
var CStruct = require("ref-struct");
var util = require("util");

var headers = require("./headers");
var INPUT_H = headers.INPUT_H;
var UINPUT_H = headers.UINPUT_H;

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

function unmask(output, type, name, cb) {
    var x = UINPUT_H["UI_SET_" + type + "BIT"];
    var y = INPUT_H[type][name];

    if (x === undefined) cb(util.format("Trying to unmask unknown type %s", type));
    if (y === undefined) cb(util.format("Trying to unmask unknown name %s", name));
    if (output.fd === null) cb("Please wait until output is opened");
    if (x !== undefined && y !== undefined) {
        var ret = LLioctl(output.fd, x, y);
        if (ret < 0) {
            cb(util.format("Error %s from ioctl while unmasking %s_%s", ret, x, y));
        } else {
            cb();
        }
    }
}

function inject(output, type, name, value, cb) {
    var ev = new InputEvent();
    ev['ref.buffer'].fill(0);
    ev.type = INPUT_H.EV[type];
    ev.code = INPUT_H[type][name];
    if (value != undefined) ev.value = value;
    output.write(ev.ref(), cb);
}

function create(output, name, vendor, product, version, cb) {
    var uidev = new UInputUserDev;
    var ret;
    uidev['ref.buffer'].fill(0);
    uidev.name.buffer.write(name || '');
    uidev.id.bustype = INPUT_H.BUS.USB;
    uidev.id.vendor = vendor || 1;
    uidev.id.product = product || 1;
    uidev.id.version = version || 1;
    output.write(uidev.ref(), function() {
        var ret = LLioctl(output.fd, UINPUT_H.UI_DEV_CREATE);
        if (ret < 0)
            cb(util.format("Error from ioctl while creating device: %s", ret));
        else
            cb();
    });
}

exports.unmask = unmask;
exports.inject = inject;
exports.create = create;
exports.headers = headers;
