require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const axios = require('axios');
const path = require('path');
const botService = require('./botService');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: 'secret_key',
  resave: false,
  saveUninitialized: false
}));

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bot_manager'
});

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect('/login');
  }
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  } else {
    res.redirect('/login');
  }
}

app.get('/admin', isAdmin, async (req, res) => {
  const [users] = await db.query('SELECT * FROM users');
  res.render('admin', { users, user: req.session.user });
});

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

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const [user] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

  if (user.length > 0) {
    const isValid = await bcrypt.compare(password, user[0].password);
    if (isValid) {
      req.session.user = { id: user[0].id, username: user[0].username, role: user[0].role };
      return res.redirect('/');
    }
  }
  res.status(400).send('Credenciais inválidas');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/', isAuthenticated, async (req, res) => {
  const [bots] = await db.query('SELECT * FROM bots WHERE user_id = ?', [req.session.user.id]);
  res.render('index', { bots, user: req.session.user });
});

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

app.post('/toggle-bot/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const [bot] = await db.query('SELECT * FROM bots WHERE id = ? AND user_id = ?', [id, req.session.user.id]);

  if (bot.length === 0) {
    return res.status(404).send('Bot não encontrado');
  }

  const newStatus = bot[0].status === 'active' ? 'inactive' : 'active';
  await db.query('UPDATE bots SET status = ? WHERE id = ?', [newStatus, id]);

  if (newStatus === 'active') {
    botService.startBot(bot[0].token);
  } else {
    botService.stopBot(bot[0].token);
  }

  res.redirect('/');
});

app.post('/delete-bot/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const [bot] = await db.query('SELECT * FROM bots WHERE id = ? AND user_id = ?', [id, req.session.user.id]);

  if (bot.length === 0) {
    return res.status(404).send('Bot não encontrado');
  }

  if (bot[0].status === 'active') {
    botService.stopBot(bot[0].token);
  }

  await db.query('DELETE FROM bots WHERE id = ? AND user_id = ?', [id, req.session.user.id]);

  res.redirect('/');
});
app.post('/delete-user/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  const [user] = await db.query('SELECT * FROM users WHERE id = ? ', [id]);

  if (user.length === 0) {
    return res.status(404).send('Bot não encontrado');
  }

  await db.query('DELETE FROM users WHERE id = ?', [id]);

  res.redirect('/admin');
});

async function deactivateAllBots() {
  try {
    await db.query('UPDATE bots SET status = "inactive"');
    console.log('Todos os bots foram desativados ao iniciar o servidor.');
  } catch (error) {
    console.error('Erro ao desativar os bots no início:', error);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  deactivateAllBots();
  console.log(`Servidor rodando na porta ${PORT}`);
});