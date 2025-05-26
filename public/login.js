async function login(event) {
  event.preventDefault();

  clearMessage();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

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
    form.addEventListener('submit', login);
  }
});
