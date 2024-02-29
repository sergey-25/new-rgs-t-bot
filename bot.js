const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const WebSocket = require("ws");
const http = require("http");

const token = process.env.TELEGRAM_TOKEN;

const bot = new TelegramBot(token, {
  polling: true,
});

const server = http.createServer();

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  const host = req.headers.host; // Extract the host from the request
  console.log('WebSocket connection established with client:', host);

  ws.on("message", (message) => {
    console.log(`Received message: ${message}`);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
function sendNotification(message) {
  console.log(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ message }));
    }
  });
}

const commands = [
  { command: "start", description: "Запуск бота" },
  { command: "menu", description: "Меню" },
];
bot.setMyCommands(commands);

const mainMenuKeyboard = [
  ["📝 Створити запит на навчання", "Запит технічної допомоги"],
  ["ℹ️ Корисна інформація", "📖 Інструкції"],
  ["☎️ Контакт служби підтримки"],
  ["❌ Закрити меню"],
];

const instructionsMenuKeyboard = [
  ["🩺💻 Інструкція для кабінету лікаря"],
  ["🧑🏻‍⚕️💻 Інструкція для кабінету пацієнта до пк"],
  ["🧑🏻‍⚕️📱 Інструкція для пацієнта до мобільного пристрою"],
  ["⬅️ Повернутися до головного меню"],
];

const infoMenuKeyboard = [
  ["⚖️ Законодавство"],
  ["▶️ Youtube канал"],
  ["⬅️ Повернутися до головного меню"],
];

const generateMenuMarkup = (year, month) => {
  const daysInMonth = new Date(year, month, 0).getDate(); // Get the number of days in the specified month
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1); // Create an array of days in the month

  // Divide the days into rows of 7 buttons per row
  const rows = [];
  for (let i = 0; i < daysArray.length; i += 7) {
    rows.push(daysArray.slice(i, i + 7));
  }

  // Generate markup for each row of buttons
  const markupRows = rows.map((row) => {
    return row.map((day) => {
      return {
        text: day.toString(), // Button text is the day number
        callback_data: `select_date_${year}-${month
          .toString()
          .padStart(2, "0")}-${day.toString().padStart(2, "0")}`, // Callback data contains the selected date
      };
    });
  });

  // Generate buttons for navigation to previous and next months
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const prevMonthButton = {
    text: "◀️",
    callback_data: `navigate_month_${prevYear}-${prevMonth
      .toString()
      .padStart(2, "0")}`,
  };
  const nextMonthButton = {
    text: "▶️",
    callback_data: `navigate_month_${nextYear}-${nextMonth
      .toString()
      .padStart(2, "0")}`,
  };

  markupRows.push([prevMonthButton, nextMonthButton]);

  return markupRows; // Return the array of arrays representing rows of buttons
};

// Function to wait for user response
function waitForReply(chatId) {
  return new Promise((resolve) => {
    bot.once("message", (msg) => {
      resolve(msg);
    });
  });
}

let isFirstMenuCall = true;

async function waitForDateSelection(chatId) {
  // Function to wait for date selection
  return new Promise((resolve) => {
    bot.once("callback_query", async (callbackQuery) => {
      const callbackData = callbackQuery.data;
      if (callbackData.startsWith("select_date")) {
        const selectedDateIndex = callbackData.lastIndexOf("_");
        const selectedDate = callbackData.substring(selectedDateIndex + 1);
        console.log("Selected date:", selectedDate);
        resolve({ text: selectedDate });
      } else if (callbackData.startsWith("navigate_month")) {
        const yearMonthMatch = callbackData.match(/(\d{4})-(\d{2})$/);
        const year = yearMonthMatch
          ? parseInt(yearMonthMatch[1])
          : new Date().getFullYear();
        const month = yearMonthMatch
          ? parseInt(yearMonthMatch[2])
          : new Date().getMonth() + 1;

        const menuMarkup = generateMenuMarkup(year, month);

        await bot.editMessageText(
          `Оберіть день проведення навчання ${year}-${month
            .toString()
            .padStart(2, "0")}:`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: {
              inline_keyboard: menuMarkup,
            },
          }
        );

        // Re-listen for date selection after navigating to a new month
        waitForDateSelection(chatId).then(resolve);
      }
    });
  });
}

async function waitForTimeSelection(chatId) {
  // Function to wait for time selection
  return new Promise((resolve) => {
    let resolved = false; // Flag to track if callback has been resolved

    const callbackHandler = async (callbackQuery) => {
      if (resolved) return; // Ignore callback if already resolved
      const callbackData = callbackQuery.data;
      if (callbackData.startsWith("select_time")) {
        const selectedTimeIndex = callbackData.lastIndexOf("_");
        const selectedTime = callbackData.substring(selectedTimeIndex + 1);
        console.log("Selected time:", selectedTime);
        resolved = true; // Set the flag to indicate callback has been resolved
        bot.removeListener("callback_query", callbackHandler); // Remove the listener
        resolve({ text: selectedTime });
      } else if (callbackData === "your_option") {
        bot.sendMessage(chatId, `Вкажіть бажаний час:`);
        bot.once("message", (msg) => {
          const customTime = msg.text.trim();
          console.log("Custom time:", customTime);
          resolved = true; // Set the flag to indicate callback has been resolved
          resolve({ text: customTime });
        });
      }
    };

    bot.on("callback_query", callbackHandler);
  });
}

async function sendStartMessage(msg) {
  if (msg.text && msg.text.length > 6) {
    const refID = msg.text.slice(7);
    await bot.sendMessage(
      msg.chat.id,
      `Ви зашли по посиланню користувача з ID ${refID}`
    );
  }

  const startMessage = `Цей бот створений для підтримки користувачів RGS. Меню доступне за командою /menu`;

  // Check if the bot has the necessary permissions to send messages
  const botInfo = await bot.getMe();
  console.log(botInfo); // Check if the bot has permission to send messages

  await bot.sendMessage(msg.chat.id, startMessage, {
    reply_markup: {
      keyboard: [],
      resize_keyboard: true,
      one_time_keyboard: true, // Show keyboard once
      request_contact: true, // Request access to contact
    },
  });
}

async function sendMainMenuMessage(msg) {
  await bot.sendMessage(msg.chat.id, `Меню бота`, {
    force_reply: true,
    reply_markup: { keyboard: mainMenuKeyboard, resize_keyboard: false },
  });
}
async function closeMenu(msg) {
  await bot.sendMessage(msg.chat.id, "Меню закрито", {
    reply_markup: { remove_keyboard: true },
  });
}

async function trainingRequest(msg) {
  const chatId = msg.chat.id;

  if (isFirstMenuCall) {
    bot.sendMessage(
      chatId,
      "Вітаємо, підкажіть будь-ласка чи проводили для вашого закладу навчання?:"
    );

    const wasThereTrainingResponse = await waitForReply(chatId);
    const wasThereTraining = wasThereTrainingResponse.text;

    bot.sendMessage(
      chatId,
      "Будь-ласка, вкажіть назву закладу або ЄДРПОУ закладу:"
    );

    const hospitalResponse = await waitForReply(chatId);
    const hospitalName = hospitalResponse.text;

    bot.sendMessage(chatId, "Будь-ласка, вкажіть як до Вас звертатися (ПІБ):");

    const recipientResponse = await waitForReply(chatId);
    const recipientName = recipientResponse.text;

    bot.sendMessage(
      chatId,
      "Будь-ласка, вкажіть ваш контактий номер телефону:"
    );

    const recipientPhoneResponse = await waitForReply(chatId);
    const recipientPhone = recipientPhoneResponse.text;

    // isFirstMenuCall = false;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const menuMarkup = generateMenuMarkup(currentYear, currentMonth);
    await bot.sendMessage(chatId, "Оберіть дату проведення навчання:", {
      force_reply: true,
      reply_markup: {
        inline_keyboard: menuMarkup,
      },
    });

    const dateResponse = await waitForDateSelection(chatId);
    const timeOptions = [
      ["10:00 - 11:00", "11:00 - 12:00"],
      ["12:00 - 13:00", "13:00 - 14:00"],
      ["14:00 - 15:00", "15:00 - 16:00"],
      ["16:00 - 17:00", "Ваш варіант"],
    ];

    const timeOptionsMarkup = timeOptions.map((row) => {
      //   return row.map((timeOption) => {
      //     return {
      //       text: timeOption,
      //       callback_data: `select_time_${dateResponse.text}_${timeOption}`,
      //     };
      //   });
      return row.map((timeOption) => {
        if (timeOption === "Ваш варіант") {
          return {
            text: timeOption,
            callback_data: `your_option`,
          };
        } else {
          return {
            text: timeOption,
            callback_data: `select_time_${dateResponse.text}_${timeOption}`,
          };
        }
      });
    });

    await bot.sendMessage(
      chatId,
      `Та обіріть бажаний час на - ${dateResponse.text}:`,
      {
        reply_markup: {
          inline_keyboard: timeOptionsMarkup,
        },
      }
    );

    const timeResponse = await waitForTimeSelection(chatId);

    bot.sendMessage(
      chatId,
      "Вкажіть перелік учасників (ПІБ, Електронну адресу):"
    );
    const presentResponse = await waitForReply(chatId);
    const trainingRequest = {
      was_there_training: wasThereTraining,
      hospital_name: hospitalName,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      date: dateResponse.text,
      time: timeResponse.text,
      participants: presentResponse.text,
    };
    console.log(trainingRequest);
    // Insert the document into MongoDB
    bot.sendMessage(chatId, "Дякуємо за запит!");
    await insertDocument(msg, trainingRequest);

    // Here you can continue with other questions if needed
  } else {
    // Handling for subsequent menu calls
  }
}

async function insertDocument(msg, document) {
  await bot.sendChatAction(msg.chat.id, "typing");
  try {
    const headers = {
      "Content-Type": "application/json", // Set the content type to JSON
      // Add any other headers as needed
    };
    const response = await axios.post(
      "https://new-rgs-bot-d96c37c57fe5.herokuapp.com/api/training-requests",
      document,
      { headers }
    );
    await sendNotification(response.data);
    console.log("Response from Express.js:", response.data);
    bot.sendMessage(
      msg.chat.id,
      "Thank you! Your training request has been submitted."
    );
  } catch (error) {
    console.error("Error sending data to Express.js:", error);
    bot.sendMessage(
      msg.chat.id,
      "Sorry, there was an error processing your request. Please try again later."
    );
  }
}

async function sendSupportContact(msg) {
  const contactInfo = `
    
  📞 <b style="color: blue;">Телефон з організаційних питань:</b> +380(66)875-60-94
        \n---------------------------------------
  📞 <b>Телефон служби підтримки:</b> +380(63)439-06-02
        \n---------------------------------------
    
        📧 <b>Email:</b> rgs.info.ua@ukr.net
        `;

  await bot.sendMessage(msg.chat.id, contactInfo, { parse_mode: "HTML" });
}

async function sendInstructionsMenu(msg) {
  await bot.sendMessage(
    msg.chat.id,
    "Тут Ви зможете знайти інструкції по платформі.",
    {
      reply_markup: {
        keyboard: instructionsMenuKeyboard,
        resize_keyboard: true,
      },
    }
  );
}

async function sendInfoMenu(msg) {
  await bot.sendMessage(
    msg.chat.id,
    "Тут Ви зможете знайти додаткову інформацію по платформі.",
    {
      reply_markup: { keyboard: infoMenuKeyboard, resize_keyboard: true },
    }
  );
}

async function sendDocument(msg, path) {
  await bot.sendMessage(msg.chat.id, `Документ завантажується...`);
  await bot.sendDocument(msg.chat.id, path);
}

async function sendUsefulInfoMessage(msg) {
  const infoMessage = `
      <b>Тут Ви зможете знайти корисну інформацію:</b>
     
      1. <a href="https://zakon.rada.gov.ua/laws/show/2801-12#Text">Основи законодавства України про охорону здоров’я, ст. 35-6</a>
      
      2. <a href="https://moz.gov.ua/article/ministry-mandates/nakaz-moz-ukraini-vid-09062022--994-pro-provedennja-testovoi-ekspluatacii-telemedichnih-platform-sistem-v-umovah-voennogo-stanu-v-ukraini">Наказ МОЗ України від 09.06.2022 № 994 «Про проведення тестової експлуатації телемедичних платформ (систем) в умовах воєнного стану в Україні»</a>
    
      3. <a href="https://moz.gov.ua/article/ministry-mandates/nakaz-moz-ukraini-vid-20062022--1062-pro-organizaciju-nadannja-medichnoi-dopomogi-iz-zastosuvannjam-telemedicini-v-umovah-voennogo-stanu">Наказ МОЗ України від 20.06.2022 № 1062 «Про організацію надання медичної допомоги із застосуванням телемедицини в умовах воєнного стану»</a>
      
      4. <a href="https://zakon.rada.gov.ua/laws/show/z1155-22#Text">Наказ МОЗ від 17.09.2022 № 1695 «Про затвердження Порядку надання медичної допомоги із застосуванням телемедицини, реабілітаційної допомоги із застосуванням телереабілітації на період дії воєнного стану в Україні або окремих її місцевостях»</a>
    
      5. <a href = "https://zakon.rada.gov.ua/laws/show/3301-20#Text">ЗАКОН УКРАЇНИ Про внесення змін до деяких законодавчих актів України щодо функціонування телемедицини</a>
      `;

  await bot.sendMessage(msg.chat.id, infoMessage, { parse_mode: "HTML" });
}
async function sendMessages(msg, text) {
  const linkToYoutube = ` 
        <b>Тут ви зможете знайти корисні для Вас відео</b>
        
        <a href="https://www.youtube.com/@serhii-qh4lw">Youtube канал RGS UKRAINE</a>`;
  await bot.sendMessage(msg.chat.id, linkToYoutube, { parse_mode: "HTML" });
}

bot.on("text", async (msg) => {
  try {
    switch (msg.text) {
      case "/start":
        await bot.sendChatAction(msg.chat.id, "typing");
        await sendStartMessage(msg);
        break;
      case "/menu":
        await sendMainMenuMessage(msg);
        break;
      case "📝 Створити запит на навчання":
        await bot.sendChatAction(msg.chat.id, "typing");
        await closeMenu(msg);
        await trainingRequest(msg);
        break;
      case "❌ Закрити меню":
        await closeMenu(msg);
        break;
      case "⬅️ Повернутися до головного меню":
        await sendMainMenuMessage(msg);
        break;
      case "☎️ Контакт служби підтримки":
        await bot.sendChatAction(msg.chat.id, "typing");
        await sendSupportContact(msg);
        break;
      case "📖 Інструкції":
        await sendInstructionsMenu(msg);
        break;
      case "🩺💻 Інструкція для кабінету лікаря":
        await sendDocument(msg, "./files/Doctors_cabinet_instruction.pdf");
        break;
      case "🧑🏻‍⚕️💻 Інструкція для кабінету пацієнта до пк":
        await sendDocument(msg, "./files/Patients_cabinet_web_manual.pdf");
        break;
      case "🧑🏻‍⚕️📱 Інструкція для пацієнта до мобільного пристрою":
        await sendDocument(msg, "./files/Patients_mobile_app_manual.pdf");
        break;
      case "ℹ️ Корисна інформація":
        await sendInfoMenu(msg);
        break;
      case "⚖️ Законодавство":
        await bot.sendChatAction(msg.chat.id, "typing");
        await sendUsefulInfoMessage(msg);
        break;
      case "▶️ Youtube канал":
        await bot.sendChatAction(msg.chat.id, "typing");
        await sendMessages(msg, "text");
        break;
      default:
        // await bot.sendMessage(msg.chat.id, 'fsdfs');
        break;
    }
  } catch (error) {
    console.log(error);
  }
});
const PORT = process.env.SOSCKET_PORT || 8090;

server.listen(PORT, function () {
  console.log(`WebSocket server is listening on port ${PORT}`);
});

module.exports = bot;
