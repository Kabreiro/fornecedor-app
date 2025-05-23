const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

// Configurações
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuração de sessão FIXADA
app.use(session({
    name: 'admin',
    secret: 'pqp123',
    resave: true,  // Alterado para true para evitar perda de sessão
    saveUninitialized: false,
    cookie: {
        secure: false, // false em desenvolvimento, true em produção com HTTPS
        httpOnly: true,
        sameSite: 'lax', // Alterado para melhor compatibilidade
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Middleware de verificação de sessão
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

// Middleware de autenticação ATUALIZADO
function requireLogin(req, res, next) {
    if (req.session.loggedIn) {
        console.log('Acesso autorizado para:', req.session.user.username);
        next();
    } else {
        console.log('Acesso negado - redirecionando para login');
        if (req.accepts('html')) {
            res.redirect('/login.html');
        } else {
            res.status(401).json({ error: 'Não autorizado' });
        }
    }
}

// Rotas públicas
app.get(['/', '/login.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Rotas protegidas
app.get(['/cadastro.html', '/lista.html'], requireLogin, (req, res) => {
    const page = req.path.substring(1);
    res.sendFile(path.join(__dirname, 'public', page));
});

// API de autenticação REVISADA
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    const usuario = usuarios.find(u => u.username === username && u.password === password);
    
    if (usuario) {
        req.session.loggedIn = true;
        req.session.user = { 
            username: usuario.username,
            loginTime: new Date()
        };
        
        console.log('Login bem-sucedido para:', usuario.username);
        
        return res.json({ 
            success: true,
            redirect: '/cadastro.html'
        });
    } else {
        console.log('Tentativa de login falhou para:', username);
        return res.status(401).json({ error: 'Credenciais inválidas' });
    }
});

// API de logout CONSOLIDADA
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao destruir sessão:', err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        
        res.clearCookie('fornecedor.sid');
        console.log('Logout realizado com sucesso');
        return res.json({ 
            success: true,
            redirect: '/login.html'
        });
    });
});

// API de verificação de autenticação
app.get('/api/check-auth', (req, res) => {
    res.json({
        authenticated: !!req.session.loggedIn,
        user: req.session.user || null
    });
});

// Rotas de API protegidas
app.use('/api/fornecedores', requireLogin);
app.get('/api/fornecedores', (req, res) => {
    res.json({
        success: true,
        data: fornecedores
    });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
    console.log('Usuários disponíveis:', usuarios.map(u => u.username));
});