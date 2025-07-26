import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import serverless from 'serverless-http';

const app = express();
app.use(cors({ origin: 'https://politicagame.netlify.app' }));
app.use(express.json());

const USERS_FILE = path.join(__dirname, 'usuarios.db');
const NEWS_FILE = path.join(__dirname, 'news.db');
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

function encryptBase64(str) {
  return Buffer.from(str).toString('base64');
}

async function getUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

async function saveUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

async function getNews() {
  try {
    const data = await fs.readFile(NEWS_FILE, 'utf8');
    return JSON.parse(data) || [];
  } catch (err) {
    return [];
  }
}

async function saveNews(news) {
  await fs.writeFile(NEWS_FILE, JSON.stringify(news, null, 2));
}

async function updateTop30(users, nation) {
  const nationUsers = users.filter(u => u.nation === nation).sort((a, b) => b.score - a.score);
  nationUsers.forEach((user, index) => {
    if (index === 0 && CARGO_LIMITS['Ditador Supremo']) user.role = powerLadder[40];
    else if (index === 1 && CARGO_LIMITS['Ditador']) user.role = powerLadder[39];
    else if (index === 2 && CARGO_LIMITS['Monarca']) user.role = powerLadder[38];
    else user.role = powerLadder[Math.min(user.level - 1, 37)];
  });
  return nationUsers.slice(0, 30);
}

async function updateEconomy(users) {
  const nationEconomies = {};
  users.forEach(user => {
    nationEconomies[user.nation] = nationEconomies[user.nation] || { totalCredits: 0, crisisCount: 0 };
    nationEconomies[user.nation].totalCredits += user.credits || 0;
  });

  users.forEach(user => {
    const economy = nationEconomies[user.nation];
    if (economy.totalCredits < economy.totalCredits * 0.5 && economy.crisisCount < 3) {
      economy.crisisCount++;
      user.score -= 200;
      if (economy.crisisCount === 3) {
        user.score = 0;
        if (user.level >= 20) user.role = "Ditador";
      }
    }
    user.credits = Math.max(0, user.credits * (1 - economy.crisisCount * 0.05));
  });
  return users;
}

async function checkElections(users, nation) {
  if (gameDate.month === 11 && [1993, 1997, 2001, 2005, 2009, 2013, 2017, 2021, 2025].includes(gameDate.year)) {
    const eligibleUsers = users.filter(u => u.nation === nation && !['Ditador Supremo', 'Ditador', 'Monarca'].includes(u.role));
    eligibleUsers.sort((a, b) => b.score - a.score);
    for (let role in CARGO_LIMITS) {
      const limit = CARGO_LIMITS[role];
      const currentCount = eligibleUsers.filter(u => u.role === role).length;
      if (currentCount < limit) {
        eligibleUsers.slice(0, limit - currentCount).forEach(u => u.role = role);
      }
    }
    await saveUsers(users);
  }
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

// Outras rotas (login, update-score, etc.) podem ser mantidas como estão

export const handler = serverless(app);