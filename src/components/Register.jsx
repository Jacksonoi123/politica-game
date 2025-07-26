const { useState } = React;

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
        <label className="block text-sm font-medium text-gray-700">Nome</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Nação</label>
        <select
          value={nation}
          onChange={(e) => setNation(e.target.value)}
          className="mt-1 p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Brasil">Brasil</option>
          <option value="EUA">EUA</option>
          <option value="China">China</option>
          <option value="Rússia">Rússia</option>
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