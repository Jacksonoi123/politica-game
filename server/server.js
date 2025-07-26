import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';

const app = express();
app.use(cors({ origin: 'https://politicagame.netlify.app' })); // Ajuste para o URL do Netlify
app.use(express.json());

const NATIONS = ['Brasil', 'EUA', 'China', 'Rússia', 'França', 'Alemanha', 'Japão', 'Índia', 'Reino Unido', 'Canadá'];
const CARGO_LIMITS = {
  'Ditador Supremo': 1,
  'Ditador': 1,
  'Monarca': 1,
  'Presidente': 1,
  'Vice-Presidente': 5,
  'Senador Vitalício': 3,
  'Senador': 10,
  'Deputado Federal': 25,
  'Deputado Estadual': 50,
  'Prefeito': 100
};
const powerLadder = [
  "Imigrante Ilegal", "Imigrante", "Cidadão Sem Direitos", "Cidadão", "Eleitor Manipulado",
  "Militante de WhatsApp", "Influenciador", "Influenciador Político", "Candidato de Baixo Orçamento",
  "Prefeito de Bairro Corrupto", "Prefeito de Bairro", "Tesoureiro de Campanha Corrupto",
  "Tesoureiro de Campanha", "Diretor Executivo de Gabinete", "Diretor Executivo Corrupto",
  "Diretor Executivo", "Vereador Fantasma", "Vereador Popular", "Vice Prefeito Corrupto",
  "Vice Prefeito", "Prefeito Corrupto", "Prefeito", "Deputado Estadual Corrupto",
  "Deputado Estadual", "Deputado Federal Corrupto", "Deputado Federal", "Senador Corrupto",
  "Senador", "Senador Vitalício Corrupto", "Senador Vitalício", "Ministro Questionável",
  "Ministro Populista", "Presidente Interino Corrupto", "Presidente Interino",
  "Vice-Presidente Corrupto", "Vice-Presidente", "Presidente Corrupto", "Presidente",
  "Monarca", "Ditador", "Ditador Supremo"
];

let gameDate = { year: 1989, month: 1, day: 1, lastUpdate: Date.now() };
let inMemoryUsers = [];

function encryptBase64(str) {
  return Buffer.from(str).toString('base64');
}

async function getUsers() {
  return inMemoryUsers;
}

async function saveUsers(users) {
  inMemoryUsers = users;
}

app.get('/', (req, res) => {
  res.json({ activeStatus: true, error: false, message: 'Server is running!' });
});

app.post('/register', async (req, res) => {
  const { name, email, password, nation } = req.body;
  if (!name || !email || !password || !nation || !NATIONS.includes(nation)) {
    return res.status(400).json({ message: 'Dados inválidos.' });
  }

  const users = await getUsers();
  if (users.find(user => user.email === encryptBase64(email))) {
    return res.status(400).json({ message: 'Email já cadastrado.' });
  }

  const encryptedEmail = encryptBase64(email);
  const encryptedPassword = encryptBase64(password);

  const newUser = {
    id: users.length + 1,
    name,
    email: encryptedEmail,
    password: encryptedPassword,
    nation,
    role: powerLadder[0],
    level: 1,
    tutorialCompleted: false,
    score: 0,
    credits: 10,
    skills: {},
    lastIP: null
  };

  users.push(newUser);
  await saveUsers(users);
  res.status(201).json({ message: 'Usuário cadastrado!', user: newUser });
});

export const handler = serverless(app);
