var Device = require("./device");

var count = 0;
function cb(err) {
	console.log(count++, err);
}
var kbd = new Device({
	name: "uinput-sample",
	key: ['M']
}).on("ready", function() {
	kbd.key('M', 1);
	kbd.syn();
	kbd.key('M', 0);
	kbd.syn();
});
