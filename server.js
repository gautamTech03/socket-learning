
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve frontend files (HTML, CSS, JS)
app.use(express.static(__dirname));

// Store currently online usernames
const onlineUsers = new Set();

// Socket.IO connection
io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    // REGISTER USER
    socket.on("register_user", (username) => {

        if (typeof username !== "string") {
            return;
        }

        username = username.trim().toLowerCase();

        if (!/^[a-z0-9_]{3,20}$/.test(username)) {
            socket.emit(
                "registration_error",
                "Username must be 3-20 characters: letters, numbers or underscores."
            );
            return;
        }

        // Prevent duplicate usernames
        if (onlineUsers.has(username)) {
            socket.emit(
                "registration_error",
                "This username is already online."
            );
            return;
        }

        // Save username to this connection
        socket.data.username = username;

        // Add user to online list
        onlineUsers.add(username);

        // Create personal room
        socket.join("user_" + username);

        console.log(username + " joined the application");

        socket.emit("registration_success", username);
    });

    // PRIVATE MESSAGE
    socket.on("send_private_message", (data) => {

        const sender = socket.data.username;

        // Check sender registration
        if (!sender) {
            return;
        }

        if (
            !data ||
            typeof data.to !== "string" ||
            typeof data.message !== "string"
        ) {
            return;
        }

        const recipient = data.to.trim().toLowerCase();
        const message = data.message.trim();

        if (!recipient || !message || message.length > 1000) {
            return;
        }

        // Check if recipient is online
        if (!onlineUsers.has(recipient)) {
            socket.emit(
                "message_error",
                "User is offline or unavailable."
            );
            return;
        }

        // Send message to recipient
        io.to("user_" + recipient).emit("receive_private_message", {
            from: sender,
            message: message
        });

        // Confirm message to sender
        socket.emit("private_message_sent", {
            to: recipient,
            message: message
        });
    });

    // DISCONNECT
    socket.on("disconnect", () => {

        const username = socket.data.username;

        if (username) {
            onlineUsers.delete(username);
            console.log(username + " disconnected");
        }

        console.log("Connection closed:", socket.id);
    });
});

// Start server
server.listen(3000, () => {
    console.log("Server running on port 3000");
});
