const { useState } = React;

function App() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <img src="/logo.png" alt="Política Game Logo" className="mx-auto mb-4 h-16" />
        <h1 className="text-3xl font-bold mb-6">Política Game</h1>
        <button
          className="w-full mb-4 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? 'Criar Conta' : 'Fazer Login'}
        </button>
        {isLogin ? <Login /> : <Register />}
      </div>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://politicagame.netlify.app/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/game.html';
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-semibold text-center">Login</h2>
      {error && <p className="text-red-500 text-center">{error}</p>}
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Email"
          required
        />
      </div>
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Senha"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Entrar
      </button>
    </form>
  );
}

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nation, setNation] = useState('Brasil');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://politicagame.netlify.app/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, nation }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Cadastro bem-sucedido! Faça login para continuar.');
        window.location.reload();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-semibold text-center">Cadastro</h2>
      {error && <p className="text-red-500 text-center">{error}</p>}
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nome"
          required
        />
      </div>
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Email"
          required
        />
      </div>
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Senha"
          required
        />
      </div>
      <div>
        <select
          value={nation}
          onChange={(e) => setNation(e.target.value)}
          className="mt-1 p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
               >
          <option value="Brasil">Brasil 🇧🇷</option>
          <option value="EUA">EUA 🇺🇸</option>
          <option value="China">China 🇨🇳</option>
          <option value="Rússia">Rússia 🇷🇺</option>
          <option value="França">França 🇫🇷</option>
          <option value="Alemanha">Alemanha 🇩🇪</option>
          <option value="Japão">Japão 🇯🇵</option>
          <option value="Índia">Índia 🇮🇳</option>
          <option value="Reino Unido">Reino Unido 🇬🇧</option>
          <option value="Canadá">Canadá 🇨🇦</option>
        </select>
      </div>
      <button
        type="submit"
        className="w-full py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Cadastrar
      </button>
    </form>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);