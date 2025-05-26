document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('fornecedorForm');
  const messageDiv = document.getElementById('message');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fornecedor = {
      cnpj: form.cnpj.value.trim(),
      razaoSocial: form.razaoSocial.value.trim(),
      nomeFantasia: form.nomeFantasia.value.trim(),
      endereco: form.endereco.value.trim(),
      cidade: form.cidade.value.trim(),
      uf: form.uf.value.trim(),
      cep: form.cep.value.trim(),
      email: form.email.value.trim(),
      telefone: form.telefone.value.trim()
    };

    try {
      const response = await fetch('/api/fornecedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(fornecedor)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao cadastrar fornecedor');
      }

      messageDiv.textContent = 'Fornecedor cadastrado com sucesso!';
      messageDiv.style.color = 'green';
      form.reset();

    } catch (error) {
      messageDiv.textContent = error.message;
      messageDiv.style.color = 'red';
      console.error('Erro ao cadastrar fornecedor:', error);
    }
  });
});
