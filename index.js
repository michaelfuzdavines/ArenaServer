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
server.listen(process.env.PORT || 3000, function(err) { if (err!=null){console.log(err)}});

// create the server
wsServer = new WebSocketServer({
    httpServer: server
});
console.log ("running");
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
			case "saveQuest":
				SaveQuest(message);
				break;
			case "loadQuest":
				LoadQuest(message);
				break;
			case "saveNextQuestIndex":
				SaveNextQuestIndex(message);
				break;
			case "getNextQuestIndex":
				GetNextQuestIndex(message);
				break;
				case "getSlaveMarket":
				GetSlaveMarket(message);
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

function SaveQuest (message){
	console.log ("Attempting to Save Quest");
	delete message.action;
	_username = message.username;
	delete message.username;
	_index = message.index;
	delete message.index;
	writeDir = _username+"replays";
	fs.mkdir(writeDir,function() {});
	jsonfile.writeFile(writeDir+"/replay"+_index+".rep", message, function (err){if (err==null){
		message["action"] = "questSaved";
		connection.sendUTF(JSON.stringify(message));
	}
	});
}

function LoadQuest (message){

	console.log ("Attempting to Load Quest");
	delete message.action;
	_username = message.username;
	delete message.username;
	questNum = message.questNum;
	readDir = _username+"replays";
	quest = jsonfile.readFileSync(readDir+"/replay"+questNum+".rep");
	quest["action"] = "questLoaded";
	connection.sendUTF(JSON.stringify(quest));
}

function SaveNextQuestIndex (message){
	console.log ("Saving Next Quest Index");
	delete message.action;
	questNum = message.nextQuestIndex;
	_username = message.username;
	delete message.username;
	writeDir = _username+"replays";
	fs.mkdir(writeDir,function() {});
	jsonfile.writeFile(writeDir+"/QuestIndex",message, function (err){if (err==null){
		message["action"] = "nextQuestIndexSaved";
		connection.sendUTF(JSON.stringify(message));
	}});

}

function GetNextQuestIndex () {
	console.log ("Getting Next Quest Index");
	delete message.action;
	_username = message.username;
	delete message.username;
	readDir = _username+"replays";
	filename = readDir+"/QuestIndex";
	fs.stat(filename, function(err, stat) {
    if(err == null) {
        nextQuest = jsonfile.readFileSync(readDir+"/QuestIndex");
	nextQuest["action"] = "setNextQuestIndex";
	console.log(nextQuest);
	connection.sendUTF(JSON.stringify(nextQuest));
    } else if(err.code == 'ENOENT') {
        
    } else {
        console.log('Some other error: ', err.code);
    }
	
});
}

function GetSlaveMarket (message){
	console.log ("Getting Slave Market");
	filename = "SlaveMarket";
	fs.stat(filename, function(err, stat) {
    if(err == null) {
        slaveMarket = jsonfile.readFileSync(filename);
	slaveMarket["action"] = "receiveSlaveMarket";
	connection.sendUTF(JSON.stringify(nextQuest));
    } else if(err.code == 'ENOENT') {
        
    } else {
        console.log('Some other error: ', err.code);
    }
});
}




