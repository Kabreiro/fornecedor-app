document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');
  const messageDiv = document.getElementById('message');

  if (!loginForm || loginForm.dataset.handlerAttached === "true") return;

  loginForm.dataset.handlerAttached = "true"; // Evita múltiplos binds

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearMessage();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

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
  });

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.style.display = 'block';
  }

  function clearMessage() {
    messageDiv.textContent = '';
    messageDiv.className = '';
    messageDiv.style.display = 'none';
  }
});
