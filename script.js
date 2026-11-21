
const socket = io();

// Get HTML elements
const usernameInput = document.getElementById("username");
const recipientInput = document.getElementById("recipient");
const messageInput = document.getElementById("message");
const statusText = document.getElementById("status");
const messagesList = document.getElementById("messages");

// Track registration
let registered = false;

// REGISTER USER
function registerUser() {
    const username = usernameInput.value.trim();

    if (!username) {
        alert("Please enter a username.");
        return;
    }

    socket.emit("register_user", username);
}

// Registration success
socket.on("registration_success", (username) => {
    registered = true;

    statusText.textContent = "● Connected as " + username;
    statusText.style.color = "green";

    usernameInput.disabled = true;

    alert("Registration successful!");
});

// Registration error
socket.on("registration_error", (error) => {
    alert(error);
});

// SEND PRIVATE MESSAGE
function sendMessage() {

    if (!registered) {
        alert("Please register first.");
        return;
    }

    const recipient = recipientInput.value.trim();
    const message = messageInput.value.trim();

    if (!recipient || !message) {
        alert("Enter recipient and message.");
        return;
    }

    socket.emit("send_private_message", {
        to: recipient,
        message: message
    });

    messageInput.value = "";
}

// Message received
socket.on("receive_private_message", (data) => {
    addMessage("From " + data.from, data.message);
});

// Message sent confirmation
socket.on("private_message_sent", (data) => {
    addMessage("You to " + data.to, data.message);
});

// Message error
socket.on("message_error", (error) => {
    alert(error);
});

// Display messages
function addMessage(sender, message) {
    const li = document.createElement("li");

    li.textContent = sender + ": " + message;

    messagesList.appendChild(li);
}

// Connection status
socket.on("connect", () => {
    console.log("Connected to server:", socket.id);

    if (!registered) {
        statusText.textContent = "● Connected to server - Please register";
        statusText.style.color = "green";
    }
});

// Disconnection status
socket.on("disconnect", () => {
    registered = false;

    statusText.textContent = "● Disconnected";
    statusText.style.color = "red";

    usernameInput.disabled = false;
});
