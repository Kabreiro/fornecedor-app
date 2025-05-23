document.addEventListener('DOMContentLoaded', function() {
    // Aplicar máscaras aos campos
    aplicarMascaras();
    
    // Verificar autenticação
    checkAuth();
    
    // Configurar eventos
    document.getElementById('logout').addEventListener('click', logout);
    document.getElementById('fornecedorForm').addEventListener('submit', enviarFormulario);
    
    // Carregar lista inicial
    loadFornecedores();
});

// Função para aplicar máscaras
function aplicarMascaras() {
    // Máscara para CNPJ (00.000.000/0000-00)
    const cnpjInput = document.getElementById('cnpj');
    cnpjInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 14) value = value.substring(0, 14);
        
        // Aplicar formatação
        if (value.length > 12) {
            value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        } else if (value.length > 8) {
            value = value.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3/');
        } else if (value.length > 5) {
            value = value.replace(/(\d{2})(\d{3})/, '$1.$2.');
        } else if (value.length > 2) {
            value = value.replace(/(\d{2})/, '$1.');
        }
        
        e.target.value = value;
    });

    // Máscara para CEP (00000-000)
    const cepInput = document.getElementById('cep');
    cepInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 8) value = value.substring(0, 8);
        
        if (value.length > 5) {
            value = value.replace(/(\d{5})(\d{3})/, '$1-$2');
        }
        
        e.target.value = value;
    });

    // Máscara para Telefone ((00) 00000-0000)
    const telefoneInput = document.getElementById('telefone');
    telefoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 11) value = value.substring(0, 11);
        
        if (value.length > 10) {
            value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (value.length > 6) {
            value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        } else if (value.length > 2) {
            value = value.replace(/(\d{2})/, '($1) ');
        }
        
        e.target.value = value;
    });

    // Máscara para UF (2 letras maiúsculas)
    const ufInput = document.getElementById('uf');
    ufInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/[^a-zA-Z]/g, '');
        if (value.length > 2) value = value.substring(0, 2);
        e.target.value = value.toUpperCase();
    });
}

// Função para validar o formulário
function validarFormulario(data) {
    const errors = {};

    // Remover formatação para validação
    const cnpj = data.cnpj.replace(/\D/g, '');
    const cep = data.cep.replace(/\D/g, '');
    const telefone = data.telefone.replace(/\D/g, '');

    // Validações
    if (!cnpj || cnpj.length !== 14) errors.cnpj = 'CNPJ inválido (deve ter 14 dígitos)';
    if (!data.razaoSocial || data.razaoSocial.length < 3) errors.razaoSocial = 'Razão Social deve ter pelo menos 3 caracteres';
    if (!data.nomeFantasia || data.nomeFantasia.length < 2) errors.nomeFantasia = 'Nome Fantasia deve ter pelo menos 2 caracteres';
    if (!data.endereco || data.endereco.length < 5) errors.endereco = 'Endereço deve ter pelo menos 5 caracteres';
    if (!data.cidade || data.cidade.length < 3) errors.cidade = 'Cidade deve ter pelo menos 3 caracteres';
    if (!data.uf || data.uf.length !== 2) errors.uf = 'UF deve ter exatamente 2 letras';
    if (!cep || cep.length !== 8) errors.cep = 'CEP inválido (deve ter 8 dígitos)';
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Email inválido';
    if (!telefone || telefone.length < 10) errors.telefone = 'Telefone inválido (mínimo 10 dígitos)';

    return errors;
}

// Função para enviar o formulário
async function enviarFormulario(e) {
    e.preventDefault();
    
    // Limpar erros anteriores
    clearErrors();
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = '';
    messageDiv.className = '';
    
    // Obter dados do formulário
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Validar antes de enviar
    const errors = validarFormulario(data);
    if (Object.keys(errors).length > 0) {
        showErrors(errors);
        return;
    }
    
    try {
        // Preparar dados para envio (remover formatação)
        const dadosParaEnvio = {
            ...data,
            cnpj: data.cnpj.replace(/\D/g, ''),
            cep: data.cep.replace(/\D/g, ''),
            telefone: data.telefone.replace(/\D/g, '')
        };
        
        // Enviar para o servidor
        const response = await fetch('/api/fornecedores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosParaEnvio),
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Sucesso
            messageDiv.textContent = 'Fornecedor cadastrado com sucesso!';
            messageDiv.className = 'success';
            e.target.reset();
            await loadFornecedores();
        } else {
            // Erros do servidor
            showErrors(result.errors || {});
        }
    } catch (error) {
        console.error('Erro:', error);
        messageDiv.textContent = 'Erro ao conectar com o servidor';
        messageDiv.className = 'error';
    }
}

// Funções auxiliares (mantidas do código anterior)
async function checkAuth() {
    try {
        const response = await fetch('/api/check-auth', { credentials: 'include' });
        const data = await response.json();
        if (!data.authenticated) window.location.href = '/login.html';
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = '/login.html';
    }
}

async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success) window.location.href = '/login.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

async function loadFornecedores() {
    try {
        const response = await fetch('/api/fornecedores', { credentials: 'include' });
        const { data } = await response.json();
        updateFornecedoresList(data);
    } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
    }
}

function updateFornecedoresList(fornecedores) {
    const tbody = document.getElementById('fornecedoresTableBody');
    tbody.innerHTML = '';
    
    fornecedores.forEach(fornecedor => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatCNPJ(fornecedor.cnpj)}</td>
            <td>${fornecedor.razaoSocial}</td>
            <td>${fornecedor.nomeFantasia}</td>
            <td>${fornecedor.cidade}/${fornecedor.uf}</td>
        `;
        tbody.appendChild(tr);
    });
}

function formatCNPJ(cnpj) {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function showErrors(errors) {
    for (const field in errors) {
        const errorElement = document.getElementById(`${field}Error`);
        if (errorElement) {
            errorElement.textContent = errors[field];
            document.getElementById(field).classList.add('error-border');
        }
    }
}

function clearErrors() {
    document.querySelectorAll('.error').forEach(el => {
        el.textContent = '';
    });
    document.querySelectorAll('input').forEach(input => {
        input.classList.remove('error-border');
    });
}
async function logout() {
  try {
    const response = await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include'
    });
    const data = await response.json();
    if (data.success) {
      window.location.href = '/login.html?logout=success';
    }
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
}