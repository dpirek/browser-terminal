// References.
var http = require('http'),
    lightnode = require('lightnode'),
    fs = require('fs'),
		c = require('../config');

var sys = require('sys');
var exec = require('child_process').exec;


// Create server.
var server = new http.Server();
server.listen(c.config.portNumber);
console.log(c.config.staticContentPath)
// Website static server.
var website = new lightnode.FileServer(c.config.staticContentPath);

// Request.
website.delegateRequest = function(req, resp) {
	return website;
};

// When a request comes to the ip server.
server.addListener('request', function(req, resp) {
	website.receiveRequest(req, resp);
});

// Sockets listerner.
var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
	
	socket.on('console', function(command, callBack){
	
		//console.log(command)
	
		function puts(error, stdout, stderr) {
		
			if(error){
				console.log('error: ');
				console.log(error);
			} else {
			}
			
			console.log(stdout);
			callBack(stdout);
			sys.puts(stdout) 
		}
		
		exec(command, puts);
	});
});

console.log('running on port: ' + c.config.portNumber + '');