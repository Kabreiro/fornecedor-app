const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

// Configurações
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// Middleware para verificar sessão
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Estado da sessão:', req.session);
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
        // Retorna JSON para APIs, redireciona para páginas
        if (req.path.startsWith('/api')) {
            res.status(401).json({ error: 'Não autorizado' });
        } else {
            res.redirect('/login.html');
        }
    }
}

// Rotas públicas
app.get(['/', '/login'], (req, res) => {
    const page = req.path === '/' ? 'index.html' : 'login.html';
    res.sendFile(path.join(__dirname, 'public', page));
});

// Rotas protegidas
app.get(['/cadastro', '/lista'], requireLogin, (req, res) => {
    const page = req.path.substring(1) + '.html';
    res.sendFile(path.join(__dirname, 'public', page));
});

// API de autenticação
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    const usuario = usuarios.find(u => u.username === username && u.password === password);
    
    if (usuario) {
        req.session.regenerate(err => {
            if (err) {
                console.error('Erro ao regenerar sessão:', err);
                return res.status(500).json({ error: 'Erro no servidor' });
            }
            
            req.session.loggedIn = true;
            req.session.user = { username };
            
            res.json({ 
                success: true,
                user: { username }
            });
        });
    } else {
        res.status(401).json({ error: 'Credenciais inválidas' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Erro ao destruir sessão:', err);
            return res.status(500).json({ error: 'Erro ao fazer logout' });
        }
        
        res.clearCookie('fornecedor.sid');
        res.json({ success: true });
    });
});

// API de fornecedores (protegida)
app.use('/api/fornecedores', requireLogin);
app.post('/api/fornecedores', (req, res) => {
    // ... (mantenha sua lógica existente de validação e cadastro)
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});