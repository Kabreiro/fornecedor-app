const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    name: 'admin',
    secret: 'pqp123',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Sessão:', {
        loggedIn: req.session.loggedIn,
        user: req.session.user
    });
    next();
});

let fornecedores = [];

const usuarios = [
    { username: 'admin', password: 'admin123' },
    { username: 'Renato', password: 'god123' }
];

function requireLogin(req, res, next) {
    if (req.session.loggedIn) {
        next();
    } else {
        if (req.accepts('html')) {
            return res.redirect('/login.html');
        } else {
            return res.status(401).json({ error: 'Não autorizado' });
        }
    }
}

app.get(['/', '/login.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get(['/cadastro.html', '/lista.html'], requireLogin, (req, res) => {
    const page = req.path.substring(1);
    res.sendFile(path.join(__dirname, 'public', page));
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Credenciais inválidas' });
    }
    const usuario = usuarios.find(u => u.username === username && u.password === password);
    if (usuario) {
        req.session.loggedIn = true;
        req.session.user = { username: usuario.username, loginTime: new Date() };
        return res.json({ success: true, redirect: '/cadastro.html' });
    }
    return res.status(401).json({ error: 'Credenciais inválidas' });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Erro no servidor' });
        res.clearCookie('admin');
        return res.json({ success: true, redirect: '/login.html' });
    });
});

app.get('/api/check-auth', (req, res) => {
    res.json({
        authenticated: !!req.session.loggedIn,
        user: req.session.user || null
    });
});

app.get('/api/fornecedores', requireLogin, (req, res) => {
    res.json({ success: true, data: fornecedores });
});

app.post('/api/fornecedores', requireLogin, (req, res) => {
    const fornecedor = req.body;
    if (!fornecedor.cnpj || !fornecedor.razaoSocial) {
        return res.status(400).json({ error: 'Dados incompletos' });
    }
    fornecedores.push(fornecedor);
    return res.json({ success: true, message: 'Fornecedor cadastrado' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
