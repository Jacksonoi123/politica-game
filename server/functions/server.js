import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import serverless from 'serverless-http';

const app = express();
app.use(cors());
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

function getUserIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
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
  await updateTop30(users, nation);
  await updateEconomy(users);
  res.status(201).json({ message: 'Usuário cadastrado!', user: newUser });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const userIP = getUserIP(req);

  if (!email) return res.status(400).json({ message: 'Email é obrigatório.' });

  const users = await getUsers();
  const encryptedEmail = encryptBase64(email);
  const user = users.find(u => u.email === encryptedEmail);

  if (!user) return res.status(401).json({ message: 'Usuário não encontrado.' });

  if (user.lastIP && user.lastIP === userIP) {
    user.lastIP = userIP;
    await saveUsers(users);
    return res.status(200).json({ user });
  }

  if (!password) return res.status(400).json({ message: 'Senha é obrigatória.' });
  if (user.password !== encryptBase64(password)) return res.status(401).json({ message: 'Senha incorreta.' });

  user.lastIP = userIP;
  await saveUsers(users);
  await updateTop30(users, user.nation);
  await updateEconomy(users);
  await checkElections(users, user.nation);
  res.status(200).json({ user });
});

app.post('/update-score', async (req, res) => {
  const { email, score } = req.body;
  if (!email || score === undefined) return res.status(400).json({ message: 'Dados inválidos.' });

  const users = await getUsers();
  const encryptedEmail = encryptBase64(email);
  const user = users.find(u => u.email === encryptedEmail);

  if (!user) {
    console.log('Usuário não encontrado para email:', email, 'encrypted:', encryptedEmail);
    return res.status(404).json({ message: 'Usuário não encontrado.' });
  }

  user.score += score;
  user.level = Math.min(Math.floor(user.score / 100) + 1, 38);
  await saveUsers(users);
  await updateTop30(users, user.nation);
  await updateEconomy(users);
  await checkElections(users, user.nation);
  res.status(200).json({ user });
});

app.post('/global-top', async (req, res) => {
  const { nation } = req.body;
  if (!nation || !NATIONS.includes(nation)) return res.status(400).json({ message: 'Nação inválida.' });

  const users = await getUsers();
  const top = await updateTop30(users, nation);
  res.status(200).json({ top });
});

app.post('/change-nation', async (req, res) => {
  const { email, newNation } = req.body;
  if (!email || !newNation || !NATIONS.includes(newNation)) {
    return res.status(400).json({ message: 'Dados inválidos.' });
  }

  const users = await getUsers();
  const encryptedEmail = encryptBase64(email);
  const user = users.find(u => u.email === encryptedEmail);

  if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

  user.nation = newNation;
  user.score = 0;
  user.level = 1;
  user.role = powerLadder[0];
  user.credits = 10;
  await saveUsers(users);
  await updateTop30(users, newNation);
  await updateEconomy(users);
  res.status(200).json({ message: 'Nação alterada com sucesso!' });
});

app.post('/create-coup', async (req, res) => {
  const { email, nation } = req.body;
  if (!email || !nation || !NATIONS.includes(nation)) return res.status(400).json({ message: 'Dados inválidos.' });

  const users = await getUsers();
  const encryptedEmail = encryptBase64(email);
  const user = users.find(u => u.email === encryptedEmail);

  if (!user) {
    console.log('Usuário não encontrado para criar golpe:', email, 'encrypted:', encryptedEmail);
    return res.status(404).json({ message: 'Usuário não encontrado.' });
  }

  const coup = { leader: user.id, members: [user.id], nation, success: false, scoreThreshold: 1000 };
  users.forEach(u => u.coup = u.coup || null);
  user.coup = coup;
  await saveUsers(users);

  const news = await getNews();
  news.push({ title: `Golpe em ${nation}!`, content: `${user.name} iniciou um golpe de estado.`, date: gameDate.year });
  await saveNews(news);

  res.status(200).json({ message: 'Golpe criado!' });
});

app.post('/join-coup', async (req, res) => {
  const { email, coupId } = req.body;
  if (!email || !coupId) return res.status(400).json({ message: 'Dados inválidos.' });

  const users = await getUsers();
  const encryptedEmail = encryptBase64(email);
  const user = users.find(u => u.email === encryptedEmail);

  if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

  const coupLeader = users.find(u => u.coup && u.coup.leader === coupId);
  if (coupLeader) {
    coupLeader.coup.members.push(user.id);
    user.coup = coupLeader.coup;
    await saveUsers(users);

    const totalScore = coupLeader.coup.members.reduce((sum, memberId) => sum + users.find(u => u.id === memberId).score, 0);
    if (totalScore >= coupLeader.coup.scoreThreshold) {
      coupLeader.coup.success = true;
      const topUsers = (await updateTop30(users, coupLeader.nation)).slice(0, 3);
      topUsers.forEach(u => {
        if (['Ditador Supremo', 'Ditador', 'Monarca'].includes(u.role)) u.role = powerLadder[0];
      });
      const vitalicios = users.filter(u => u.role === 'Senador Vitalício' && u.nation === coupLeader.nation);
      vitalicios.forEach(u => u.role = powerLadder[0]);
      const senators = users.filter(u => u.role === 'Senador' && u.nation === coupLeader.nation).sort((a, b) => b.score - a.score).slice(0, 3);
      senators.forEach(u => u.role = 'Senador Vitalício');
      coupLeader.role = 'Ditador Supremo';
      if (coupLeader.coup.members.length > 1) users.find(u => u.id === coupLeader.coup.members[1]).role = 'Ditador';

      await saveUsers(users);
      const news = await getNews();
      news.push({ title: `Golpe bem-sucedido em ${coupLeader.nation}!`, content: `${coupLeader.name} é o novo Ditador Supremo.`, date: gameDate.year });
      await saveNews(news);
    }
    res.status(200).json({ message: 'Juntou-se ao golpe!' });
  } else {
    res.status(404).json({ message: 'Golpe não encontrado.' });
  }
});

app.get('/news/:nation', async (req, res) => {
  const { nation } = req.params;
  if (!NATIONS.includes(nation)) return res.status(400).json({ message: 'Nação inválida.' });

  const news = await getNews();
  res.status(200).json({ news: news.filter(n => n.date >= gameDate.year - 1) });
});

app.post('/post-news', async (req, res) => {
  const { email, title, content, isInternational } = req.body;
  if (!email || !title || !content) return res.status(400).json({ message: 'Dados inválidos.' });

  const users = await getUsers();
  const encryptedEmail = encryptBase64(email);
  const user = users.find(u => u.email === encryptedEmail);

  if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
  if (powerLadder.indexOf(user.role) < powerLadder.indexOf('Prefeito Corrupto')) {
    return res.status(403).json({ message: 'Apenas cargos de Prefeito Corrupto ou superior podem postar notícias.' });
  }

  const news = await getNews();
  news.push({ title, content, date: gameDate.year, nation: user.nation, isInternational });
  await saveNews(news);
  res.status(200).json({ message: 'Notícia postada!' });
});

app.get('/game-date', (req, res) => {
  const now = Date.now();
  const elapsedMs = now - gameDate.lastUpdate;
  const msPerDay = 2500; // 2.5 segundos por dia
  const msPerMonth = msPerDay * 30; // 1 minuto e 15 segundos por mês
  const msPerYear = msPerMonth * 12; // 15 minutos por ano
  const totalDays = Math.floor(elapsedMs / msPerDay);
  const yearsPassed = Math.floor(totalDays / 360); // Aproximadamente 360 dias por ano
  const remainingDays = totalDays % 360;
  const monthsPassed = Math.floor(remainingDays / 30);
  const daysPassed = remainingDays % 30;

  gameDate.year = 1989 + yearsPassed;
  gameDate.month = 1 + monthsPassed;
  gameDate.day = 1 + daysPassed;
  gameDate.lastUpdate = now;

  if (gameDate.day > 30) {
    gameDate.day = 1;
    gameDate.month++;
  }
  if (gameDate.month > 12) {
    gameDate.month = 1;
    gameDate.year++;
  }

  res.status(200).json(gameDate);
});

export const handler = serverless(app);