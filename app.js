require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const axios = require('axios');
const path = require('path');
const botService = require('./botService'); // Importa o serviço de bot
const app = express();

// Configurações
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configurações de sessão
app.use(session({
  secret: 'secret_key', // Colocar chave secreta real
  resave: false,
  saveUninitialized: false
}));

// Conexão com o banco de dados MySQL
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bot_manager'
});

// Middleware de autenticação
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect('/login');
  }
}

// Rota de registro
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    res.redirect('/login');
  } catch (err) {
    res.status(400).send('Erro ao criar usuário');
  }
});

// Rota de login
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const [user] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

  if (user.length > 0) {
    const isValid = await bcrypt.compare(password, user[0].password);
    if (isValid) {
      req.session.user = { id: user[0].id, username: user[0].username };
      return res.redirect('/');
    }
  }
  res.status(400).send('Credenciais inválidas');
});

// Rota para logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Rota principal protegida
app.get('/', isAuthenticated, async (req, res) => {
  const [bots] = await db.query('SELECT * FROM bots WHERE user_id = ?', [req.session.user.id]);
  res.render('index', { bots, username: req.session.user.username });
});

// Rota para adicionar um novo bot
app.post('/add-bot', isAuthenticated, async (req, res) => {
  const { token } = req.body;
  try {
    const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    if (response.data.ok) {
      await db.query('INSERT INTO bots (token, status, user_id) VALUES (?, "inactive", ?)', [token, req.session.user.id]);
      res.redirect('/');
    } else {
      res.status(400).send('Token inválido');
    }
  } catch (err) {
    res.status(400).send('Erro ao validar o token');
  }
});

// Rota para ativar/desativar um bot
app.post('/toggle-bot/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const [bot] = await db.query('SELECT * FROM bots WHERE id = ? AND user_id = ?', [id, req.session.user.id]);

  if (bot.length === 0) {
    return res.status(404).send('Bot não encontrado');
  }

  const newStatus = bot[0].status === 'active' ? 'inactive' : 'active';
  await db.query('UPDATE bots SET status = ? WHERE id = ?', [newStatus, id]);

  if (newStatus === 'active') {
    botService.startBot(bot[0].token); // Ativa o bot
  } else {
    botService.stopBot(bot[0].token); // Desativa o bot
  }

  res.redirect('/');
});

app.post('/delete-bot/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const [bot] = await db.query('SELECT * FROM bots WHERE id = ? AND user_id = ?', [id, req.session.user.id]);

  if (bot.length === 0) {
    return res.status(404).send('Bot não encontrado');
  }

  // Se o bot estiver ativo, pare o bot antes de deletar
  if (bot[0].status === 'active') {
    botService.stopBot(bot[0].token);
  }

  // Deleta o bot do banco de dados
  await db.query('DELETE FROM bots WHERE id = ? AND user_id = ?', [id, req.session.user.id]);

  res.redirect('/');
});

async function deactivateAllBots() {
  try {
    await db.query('UPDATE bots SET status = "inactive"');
    console.log('Todos os bots foram desativados ao iniciar o servidor.');
  } catch (error) {
    console.error('Erro ao desativar os bots no início:', error);
  }
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  deactivateAllBots();
  console.log(`Servidor rodando na porta ${PORT}`);
});
