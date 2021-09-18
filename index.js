const express       = require('express');
const app           = express();
const http          = require('http');
const httpServer    = http.createServer(app);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.raw());

const io = require("socket.io")(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.get('/', (req, res) => {
  
    res.send('<h1>Socket.IO Run Success</h1>');

});

app.post('/message', (req, res) => {

    res.setHeader('Content-Type', 'application/json');

    var json = { status:'ok' };
    var post = req.body;

    try {
        io.to(post.to).emit("message", {message:post.message});
    }catch(e) {
        json.status = 'error';
        json.error  = e.toString();
    }

    res.end(JSON.stringify(json));

});

app.get('/user/list', (req, res) => {

    res.setHeader('Content-Type', 'application/json');

    var json = { status:'ok' };
    var post = req.body;

    var clients = io.sockets.clients();

    json.users  = clients;
    
    res.end(JSON.stringify(json));

});

app.get('/room/list', (req, res) => {

    res.setHeader('Content-Type', 'application/json');

    var json    = { status:'ok' };
    var post    = req.body;

    json.rooms  = io.of("/").adapter.rooms;

    // .map(function(key, room){
    //     if( key = regex.exec(/room\-.+/g) ) {
    //         return key;
    //     }
    // });

    console.log(io.sockets.adapter.rooms);

    res.end(JSON.stringify(json));

});

var users = {};

io.on('connection', (socket) => {
    
    console.log('a user connected');

    users[socket.id] = socket.id;

    socket.broadcast.emit("user-connected", {message:"You are connected."});

    io.to(socket.id).emit("user-listed", users);
    socket.broadcast.emit("user-listed", users);

    socket.on('message', (arg) => {

        var userId = arg.to;

        console.log(arg);

        try {
            io.to(userId).emit("message", {message:arg.message});
        }catch(e){
            console.log("cannot send message to " + userId);
        }

    });

    socket.on("switchroom", (arg) => {

        // { room:"roomId" }

        try {
            console.log("join room " + arg.room);
            socket.join("room-"+arg.room);
        }catch(e){
            console.log("cannot join room");
        }

    });

    socket.on('disconnecting', () => {
        
        delete users[socket.id];

        socket.broadcast.emit("user-listed", JSON.stringify(users));

        //console.log(socket.rooms); // the Set contains at least the socket ID
    
    });

    socket.on('disconnect', () => {
        
        console.log('user disconnected');

    });

});

httpServer.listen(3000, '0.0.0.0', () => {
    
    console.log('listening on *:3000');

});