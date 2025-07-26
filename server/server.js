import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';

const app = express();
app.use(cors({ origin: 'https://politicagame.netlify.app' }));
app.use(express.json());

let inMemoryUsers = [];

app.get('/', (req, res) => {
  console.log('Requisição GET / recebida');
  res.json({ activeStatus: true, error: false, message: 'Server is running!' });
});

app.post('/register', async (req, res) => {
  console.log('Requisição POST /register recebida', req.body);
  try {
    const { name, email, password, nation } = req.body;
    if (!name || !email || !password || !nation) {
      console.log('Dados inválidos');
      return res.status(400).json({ message: 'Dados inválidos.' });
    }

    const users = inMemoryUsers;
    if (users.find(user => user.email === Buffer.from(email).toString('base64'))) {
      console.log('Email já cadastrado');
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
    console.log('Usuário cadastrado', newUser);
    res.status(201).json({ message: 'Usuário cadastrado!', user: newUser });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

export const handler = serverless(app);
