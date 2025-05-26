async function checkAuth() {
  try {
    const response = await fetch('/api/check-auth', {
      credentials: 'include'
    });
    const data = await response.json();

    if (!data.authenticated) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    window.location.href = '/login.html';
    return false;
  }
}

async function submitFornecedor(event) {
  event.preventDefault();
  clearMessage();

  const fornecedor = {
    cnpj: document.getElementById('cnpj').value.trim(),
    razaoSocial: document.getElementById('razaoSocial').value.trim(),
    nomeFantasia: document.getElementById('nomeFantasia').value.trim(),
    endereco: document.getElementById('endereco').value.trim(),
    cidade: document.getElementById('cidade').value.trim(),
    uf: document.getElementById('uf').value.trim(),
    cep: document.getElementById('cep').value.trim(),
    email: document.getElementById('email').value.trim(),
    telefone: document.getElementById('telefone').value.trim()
  };

  try {
    const response = await fetch('/api/fornecedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fornecedor),
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      showMessage('Fornecedor cadastrado com sucesso!', 'success');
      document.getElementById('fornecedorForm').reset();
    } else {
      showMessage(data.error || 'Erro ao cadastrar fornecedor', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    showMessage('Erro ao conectar com o servidor', 'error');
  }
}

function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = type;
  messageDiv.style.display = 'block';
}

function clearMessage() {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = '';
  messageDiv.className = '';
  messageDiv.style.display = 'none';
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

document.addEventListener('DOMContentLoaded', async function () {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) return;

  const form = document.getElementById('fornecedorForm');
  if (form) {
    form.addEventListener('submit', submitFornecedor);
  }

  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
});
