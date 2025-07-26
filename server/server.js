import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';

const app = express();
app.use(cors({ origin: 'https://politicagame.netlify.app' }));
app.use(express.json());

let inMemoryUsers = [];

app.get('/', (req, res) => {
  console.log('GET / - Server is running');
  res.json({ activeStatus: true, error: false, message: 'Server is running!' });
});

app.post('/register', (req, res) => {
  console.log('POST /register - Received:', req.body);
  try {
    const { name, email, password, nation } = req.body;
    if (!name || !email || !password || !nation) {
      console.log('Invalid data');
      return res.status(400).json({ message: 'Dados inválidos.' });
    }

    const users = inMemoryUsers;
    if (users.find(user => user.email === Buffer.from(email).toString('base64'))) {
      console.log('Email already registered');
      return res.status(400).json({ message: 'Email já cadastrado.' });
    }

    const newUser = {
      id: users.length + 1,
      name,
      email: Buffer.from(email).toString('base64'),
      password: Buffer.from(password).toString('base64'),
      nation,
      role: 'Imigrante Ilegal',
      level: 1,
      score: 0,
      credits: 10
    };

    inMemoryUsers.push(newUser);
    console.log('User registered:', newUser);
    res.status(201).json({ message: 'Usuário cadastrado!', user: newUser });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ message: 'Erro interno no servidor.', details: error.message });
  }
});

export const handler = serverless(app);
