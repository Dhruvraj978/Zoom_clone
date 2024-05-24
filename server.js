const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
    debug: true,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
    const roomId = uuidv4();
    console.log(`Creating new room: ${roomId}`);
    res.redirect(`/${roomId}`);
});

app.get("/:room", (req, res) => {
    console.log(`Joining room: ${req.params.room}`);
    res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
    console.log(`New socket connection: ${socket.id}`);
    
    socket.on("join-room", (roomId, userId) => {
        console.log(`User ${userId} joining room: ${roomId}`);
        socket.join(roomId);
        socket.broadcast.to(roomId).emit("user-connected", userId);

        socket.on("message", (message) => {
            console.log(`Message from ${userId} in room ${roomId}: ${message}`);
            io.to(roomId).emit("createMessage", message);
        });

        socket.on("disconnect", () => {
            console.log(`User ${userId} disconnected from room ${roomId}`);
            socket.broadcast.to(roomId).emit("user-disconnected", userId);
        });
    });
});

const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
