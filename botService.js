const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const activeBots = {};

function startBot(token) {
  if (activeBots[token]) {
    console.log('Bot is already active');
    return;
  }

  const bot = new TelegramBot(token, { polling: true });
  activeBots[token] = bot;

  console.log(`Bot with token ${token} has been started.`);

  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;

    switch (userMessage) {
      case '/start':
        bot.sendMessage(chatId, `Welcome, ${msg.from.first_name}! Use the /help command to see available commands.`);
        break;

      case '/help':
        bot.sendMessage(chatId, 'Available commands:\n/start - Start\n/help - Help\n/crypto - Bitcoin Price');
        break;

      case '/crypto':
        getCryptoPrice(bot, chatId);
        break;
    }
  });
}

function stopBot(token) {
  const bot = activeBots[token];
  if (bot) {
    bot.stopPolling();
    delete activeBots[token];
    console.log(`Bot with token ${token} has been stopped.`);
  }
}

async function getCryptoPrice(bot, chatId) {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const price = response.data.bitcoin.usd;
    bot.sendMessage(chatId, `The current price of Bitcoin is: $${price}`);
  } catch (err) {
    bot.sendMessage(chatId, 'Error when checking Bitcoin price.');
  }
}

module.exports = {
  startBot,
  stopBot,
};
