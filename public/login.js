async function login(event) {
  event.preventDefault();

  clearMessage();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    showMessage('Preencha usuário e senha', 'error');
    return;
  }

  const submitBtn = event.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      window.location.href = '/cadastro.html?login=success';
    } else {
      showMessage(data.error || 'Credenciais inválidas', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    showMessage('Erro ao conectar com o servidor', 'error');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
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

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('loginForm');
  if (form) {
    form.removeEventListener('submit', login);
    form.addEventListener('submit', login);
  }
});
