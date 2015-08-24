var WebSocketServer = require('websocket').server;
var http = require('http');
var jsonfile = require('jsonfile');
var file = 'data.json';
var fs = require('fs');
var util = require('util');

var accountDir = "accounts";
 fs.mkdir(accountDir,function() {});


var server = http.createServer(function(request, response) {
    // process HTTP request. Since we're writing just WebSockets server
    // we don't have to implement anything.
});
server.listen(3000, function(err) { if (err!=null){console.log(err)}});

// create the server
wsServer = new WebSocketServer({
    httpServer: server
});
var connection;
// WebSocket server
wsServer.on('request', function(request) {
    connection = request.accept(null, request.origin);

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(data) {
    
    	console.log(data.utf8Data);
    	message = JSON.parse(data.utf8Data);
    	action = message.action;
    	switch (action){
			case "login":
				Login(message);
				break;
			case "saveAccount":
				SaveAccount(message);
				break;
		}
	});


    connection.on('close', function(connection) {
        // close user connection
    });
});

function Login (message) {
	delete message.action;
	account = accountDir+"/"+message.username;
	fs.stat(account, function(err, stat) {
    if(err == null) {
        console.log('File exists');
        loginData = jsonfile.readFileSync(account);
        loginData["action"] = "login";
        connection.sendUTF(JSON.stringify(loginData));
    } else if(err.code == 'ENOENT') {
        jsonfile.writeFile(account, message, function (err){if (err==null){
        	message["action"] = "newAccount";
        	connection.sendUTF(JSON.stringify(message));
        }});

    } else {
        console.log('Some other error: ', err.code);
    }


});
}

function SaveAccount (message){
	console.log ("Attempting to Save Account");
	delete message.action;
	account = accountDir+"/"+message.username;
	jsonfile.writeFile(account, message, function (err){if (err==null){
		message["action"] = "accountSaved";
		connection.sendUTF(JSON.stringify(message));
	}
	});
}
