const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

// Configurações melhoradas
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Configuração de sessão reforçada
app.use(session({
  name: 'fornecedor.sid',
  secret: 'sua-chave-secreta-muito-segura-aqui@123!',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Em produção deve ser true (HTTPS)
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Middleware de debug
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Estado da sessão:', {
    loggedIn: req.session.loggedIn,
    user: req.session.user
  });
  next();
});

// Banco de dados em memória
let fornecedores = [];
const usuarios = [
  { username: 'admin', password: 'admin123' },
  { username: 'Renato', password: 'god123' }
];

// Middleware de autenticação
function requireLogin(req, res, next) {
  if (req.session.loggedIn) {
    next();
  } else {
    res.status(401).json({ 
      success: false, 
      error: 'Não autorizado. Faça login primeiro.' 
    });
  }
}

// Rotas estáticas
app.get(['/', '/cadastro', '/lista', '/login'], (req, res) => {
  const requestedPath = req.path === '/' ? 'index.html' : `${req.path.substring(1)}.html`;
  res.sendFile(path.join(__dirname, 'public', requestedPath));
});

// API de autenticação
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Usuário e senha são obrigatórios' 
    });
  }

  const usuario = usuarios.find(u => 
    u.username === username && u.password === password
  );
  
  if (usuario) {
    req.session.regenerate(err => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          error: 'Erro ao iniciar sessão' 
        });
      }
      
      req.session.loggedIn = true;
      req.session.user = { 
        username: usuario.username,
        loginTime: new Date().toISOString()
      };
      
      res.json({ 
        success: true,
        user: { username: usuario.username }
      });
    });
  } else {
    res.status(401).json({ 
      success: false, 
      error: 'Credenciais inválidas' 
    });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Erro ao fazer logout:', err);
      return res.status(500).json({ success: false, error: 'Erro ao fazer logout' });
    }
    res.clearCookie('fornecedor.sid');
    res.json({ success: true, message: 'Logout realizado com sucesso' });
  });
});

app.get('/api/check-auth', (req, res) => {
  res.json({ 
    authenticated: !!req.session.loggedIn,
    user: req.session.user || null
  });
});

// API de fornecedores
app.post('/api/fornecedores', requireLogin, (req, res) => {
  const camposObrigatorios = {
    cnpj: 'CNPJ é obrigatório',
    razaoSocial: 'Razão Social é obrigatória',
    nomeFantasia: 'Nome Fantasia é obrigatório',
    endereco: 'Endereço é obrigatório',
    cidade: 'Cidade é obrigatória',
    uf: 'UF é obrigatória',
    cep: 'CEP é obrigatório',
    email: 'Email é obrigatório',
    telefone: 'Telefone é obrigatório'
  };

  const errors = Object.entries(camposObrigatorios)
    .filter(([campo]) => !req.body[campo])
    .reduce((acc, [campo, msg]) => ({ ...acc, [campo]: msg }), {});

  // Validações específicas
  if (req.body.cnpj && !/^\d{14}$/.test(req.body.cnpj)) {
    errors.cnpj = 'CNPJ deve conter exatamente 14 dígitos';
  }

  if (req.body.uf && !/^[A-Z]{2}$/.test(req.body.uf.toUpperCase())) {
    errors.uf = 'UF deve ter exatamente 2 letras';
  }

  if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
    errors.email = 'Email inválido';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  if (fornecedores.some(f => f.cnpj === req.body.cnpj)) {
    return res.status(409).json({ 
      success: false, 
      error: 'CNPJ já cadastrado' 
    });
  }

  const novoFornecedor = {
    id: Date.now().toString(),
    ...req.body,
    uf: req.body.uf.toUpperCase(),
    dataCadastro: new Date().toISOString()
  };

  fornecedores.push(novoFornecedor);
  res.status(201).json({ success: true, data: novoFornecedor });
});

app.get('/api/fornecedores', requireLogin, (req, res) => {
  res.json({ 
    success: true, 
    count: fornecedores.length,
    data: fornecedores 
  });
});

app.get('/api/fornecedores/:id', requireLogin, (req, res) => {
  const fornecedor = fornecedores.find(f => f.id === req.params.id);
  if (!fornecedor) {
    return res.status(404).json({ 
      success: false, 
      error: 'Fornecedor não encontrado' 
    });
  }
  res.json({ success: true, data: fornecedor });
});

// Rota para página não encontrada
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Manipulador de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Erro interno no servidor' 
  });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
  console.log('Usuários disponíveis:', usuarios.map(u => u.username));
});