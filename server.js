var express = require("express");
var app = express();
var bodayParser = require("body-parser");
var path = require("path");
var uuid = require("uuid-random");

const { uniqueNamesGenerator, adjectives, colors, animals, names } = require("unique-names-generator");

var PORT = process.env.PORT || 3999; // server running on port 3999

var server = app.listen(PORT, function() {
        var host = server.address().address;
        var port = server.address().port;
        console.log('Listening at http://%s:%s', 'localhost:', port);
});

app.use(bodayParser.json());

app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
});

var io = require('socket.io')(server);

var chatRoomData = [];
var connectedClients = {};

function sendUpdatedChatRoomData(client) {
        client.emit("RetrieveChatRoomData", chatRoomData);
        client.broadcast.emit("RetrieveChatRoomData", chatRoomData);
}

io.on('connection', (client) => {
        console.log("New client connected");

        client.on("SendMessage", (messageData) => {
                chatRoomData.push(messageData);
                sendUpdatedChatRoomData(client);
        });

        client.on("UserEnteredRoom", (userData) => {
                var enteredRoomMessage = {message: `${userData.username} has entered the chat`, username: "", userID: 0, timestamp: null};
                chatRoomData.push(enteredRoomMessage);
                sendUpdatedChatRoomData(client);
                connectedClients[client.id] = userData;
        });

        client.on("CreateUserData", () => {
                let userID = uuid();
                let userName = uniqueNamesGenerator({ dictionaries: [adjectives, names]});
                var userData = {userID: userID, username: userName};
                client.emit("SetUserData", userData);
        });

        client.on("disconnecting", (data) => {
                console.log("Client disconnecting...");

                if (connectedClients[client.id]) {
                        var leftRoomMessage = {message: `${connectedClients[client.id].username} has left the chat`, username: "", userID: 0, timestamp: null};
                        chatRoomData.push(leftRoomMessage);
                        sendUpdatedChatRoomData(client);
                        delete connectedClients[client.id];
                }
        });

        client.on('ClearChat', () => {
                chatRoomData = [];
                console.log(chatRoomData);
                sendUpdatedChatRoomData(client);
        });
});
