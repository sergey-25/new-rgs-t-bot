
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

const trainingRequestRoutes = require("./routes/trainingRequestRoutes.js");
const supportRequestRoutes = require("./routes/supportRequestRoutes.js");
dotenv.config();

const token = process.env.TELEGRAM_TOKEN;
const mongoToken = process.env.MONGODB_URI; 
const app = express();

app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(mongoToken, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("Connected to MongoDB"));


const server = http.createServer(app); // Create HTTP server

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"],
  },
});
io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});


const bot = require("./bot.js")(io);

app.use("/api", trainingRequestRoutes);
app.use("/api", supportRequestRoutes);

// Handle webhook events
app.post("/webhook", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});


const webhookUrl = 'https://new-rgs-bot-e6e357c7268f.herokuapp.com/webhook'; // Update with your deployed bot's URL
bot.setWebHook(`${webhookUrl}/bot${token}`);

module.exports = { app, io }; 