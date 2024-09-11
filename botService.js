const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const activeBots = {};

function startBot(token) {
  if (activeBots[token]) {
    console.log('Bot já está ativo');
    return;
  }

  const bot = new TelegramBot(token, { polling: true });
  activeBots[token] = bot;

  console.log(`Bot com token ${token} foi iniciado.`);

  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;

    if (userMessage === '/start') {
      bot.sendMessage(chatId, `Bem-vindo(a), ${msg.from.first_name}! Use o comando /help para ver os comandos disponíveis.`);
    }

    if (userMessage === '/help') {
      bot.sendMessage(chatId, 'Comandos disponíveis:\n/start - Iniciar\n/help - Ajuda\n/crypto - Preço do Bitcoin');
    }

    if (userMessage === '/crypto') {
      getCryptoPrice(bot, chatId);
    }
  });
}

function stopBot(token) {
  const bot = activeBots[token];
  if (bot) {
    bot.stopPolling();
    delete activeBots[token];
    console.log(`Bot com token ${token} foi parado.`);
  }
}

async function getCryptoPrice(bot, chatId) {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const price = response.data.bitcoin.usd;
    bot.sendMessage(chatId, `O preço atual do Bitcoin é: $${price}`);
  } catch (err) {
    bot.sendMessage(chatId, 'Erro ao consultar o preço do Bitcoin.');
  }
}

module.exports = {
  startBot,
  stopBot,
};
