const http = require('http');
const fs = require('fs');
const lightnode = require('lightnode');
const { Server } = require('socket.io');
const c = require('../config');
const sys = require('sys');
const exec = require('child_process').exec;

const PORT = 8080;
const SOCKET_PORT = 3000;

// Create server.
const server = new http.Server();
server.listen(PORT);
const io = new Server(SOCKET_PORT);

// Website static server.
const website = new lightnode.FileServer(__dirname + '/public');

// Request.
website.delegateRequest = function(req, resp) {
	return website;
};

// When a request comes to the ip server.
server.addListener('request', function(req, resp) {
	website.receiveRequest(req, resp);
});

io.sockets.on('connection', function (socket) {
	socket.on('console', function(command, callBack){

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