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

async function loadFornecedores() {
  try {
    const response = await fetch('/api/fornecedores', {
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Erro ao carregar fornecedores');

    const { data } = await response.json();
    renderFornecedores(data);
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao carregar fornecedores');
  }
}

function renderFornecedores(fornecedores) {
  const tbody = document.getElementById('fornecedoresTableBody');
  if (!tbody) {
    console.warn('Elemento #fornecedoresTableBody não encontrado.');
    return;
  }

  tbody.innerHTML = '';

  fornecedores.forEach(fornecedor => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatCNPJ(fornecedor.cnpj)}</td>
      <td>${fornecedor.razaoSocial}</td>
      <td>${fornecedor.nomeFantasia}</td>
      <td>${fornecedor.cidade}/${fornecedor.uf}</td>
      <td>${fornecedor.email}</td>
    `;
    tbody.appendChild(tr);
  });
}

function formatCNPJ(cnpj) {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
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

  // Configura logout
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Carrega fornecedores
  await loadFornecedores();
});
