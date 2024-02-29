
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const trainingRequestRoutes = require("./routes/trainingRequestRoutes.js");

dotenv.config();

const token = process.env.TELEGRAM_TOKEN;
const mongoToken = process.env.MONGODB_URI; 
const app = express();

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

const bot = require("./bot.js");
app.use("/api", trainingRequestRoutes);

// Handle webhook events
app.post("/webhook", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});


const webhookUrl = 'https://new-rgs-bot-d96c37c57fe5.herokuapp.com/webhook'; // Update with your deployed bot's URL
bot.setWebHook(`${webhookUrl}/bot${token}`);