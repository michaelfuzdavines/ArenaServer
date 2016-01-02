var WebSocketServer = require('websocket').server;
var http = require('http');
var jsonfile = require('jsonfile');
var file = 'data.json';
var fs = require('fs');
var util = require('util');

var accountDir = "accounts";
 fs.mkdir(accountDir,function() {});
 if (process.env.REDIS_URL==null){          
var client = require('redis').createClient("redis://h:pb8dn7ao20k9eeg7b9oh48lpcv@ec2-54-243-135-236.compute-1.amazonaws.com:17479");
console.log("isnull");
 } else {
var client = require('redis').createClient(process.env.REDIS_URL);
}
client.on('connect', function() {
    console.log('connected');
    
});

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
wsServer.on('connect', function (){
	
})
wsServer.on('request', function(request) {
	 console.log("Request Made");
    connection = request.accept(null, request.origin);

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(data) {
    	connection.sendUTF("Request Received");
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
			case "addEntry":
				AddEntry(message);
				break;
			case "getAllEntries":
				GetAllEntries();
				break;
			case "clearDB":
				ClearDB();

		}
	});


    connection.on('close', function(connection) {
        // close user connection
    });
});

function ClearDB () {

	client.flushdb();
}

function AddEntry(message){
	console.log ("Adding Entry");
	client.set (message.entryName, JSON.stringify(message.entryLineup), function (err, reply){
		if (err){
			console.log("REDIS error: "+err);
			connection.sendUTF("Error: "+err);
		}
		else{
			console.log ("REDIS response: "+reply);
			connection.sendUTF (reply);
		}
	});
}

function GetAllEntries (){
	client.scan(0,function(err, reply) {
		for (i = 0; i<reply[1].length; i++){
			var key = reply[1][i];
			client.get(key, function (err, reply){
				var _data = {};
				var _lineup = JSON.parse(reply); 
				_data["entryName"] = key; 
				_data["lineup"] = _lineup;

				connection.sendUTF(JSON.stringify(_data))
			});
			}	
	});
}



function Login (message) {
	delete message.action;
	account = accountDir+"/"+message.username;
	fs.stat(account, function(err, stat) {
    if (2 == 3) {
        console.log('File exists');
        loginData = jsonfile.readFileSync(account);
        loginData["action"] = "login";
        connection.sendUTF(JSON.stringify(loginData));
    } else {
        jsonfile.writeFile(account, message, function (err){if (err==null){
        	message["action"] = "newAccount";
        	connection.sendUTF(JSON.stringify(message));
        	client.scan(0,function(err, reply) {
    			connection.sendUTF(reply[1]);
			});
        }});

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




