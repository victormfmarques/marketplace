// js/modules/carrinho.js
import { config } from './config.js';
import { mostrarFeedback } from './ui.js';

// Estado centralizado do carrinho
let carrinho = []; // Começa sempre vazio na memória

function carregarCarrinhoDoStorage() {
    const carrinhoSalvo = JSON.parse(localStorage.getItem(getChaveCarrinho())) || [];
    // Filtra o carrinho para garantir que cada item seja um objeto válido com id e preço
    carrinho = carrinhoSalvo.filter(item => 
        item && typeof item === 'object' && item.id && typeof item.preco === 'number'
    );
}

// Inicialização do carrinho
export function setupCarrinho() {
    carregarCarrinhoDoStorage();
    atualizarCarrinhoUI();

    const iconeCarrinho = document.querySelector('.carrinho-icone');
    const dropdown = document.getElementById('carrinho-dropdown');

    // Adiciona evento para abrir/fechar o dropdown
    iconeCarrinho?.addEventListener('click', toggleCarrinho);
    
    // Adiciona evento para fechar o dropdown ao clicar fora
    document.addEventListener('click', (e) => {
        // Verifica se o clique foi fora do ícone E fora do dropdown
        if (dropdown && !iconeCarrinho?.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    // --- DELEGAÇÃO DE EVENTOS ---
    // Adiciona UM único ouvinte de clique no dropdown do carrinho
    if (dropdown) {
        dropdown.addEventListener('click', (e) => {
            // Verifica se o elemento clicado (e.target) tem a classe 'btn-limpar'
            if (e.target.classList.contains('btn-limpar')) {
                limparCarrinho();
            }

            // Verifica se o elemento clicado tem o ID 'finalizar-compra'
            if (e.target.id === 'finalizar-compra') {
                window.location.href = '/paginas/finalizar-compra.html'; // Corrigi o caminho para ser absoluto
            }

            // Verifica se o elemento clicado tem a classe 'btn-remover'
            if (e.target.classList.contains('btn-remover')) {
                const produtoId = e.target.dataset.id;
                removerUmaUnidade(produtoId);
            }
        });
    }
}

// Adicionar produto ao carrinho
export function adicionarAoCarrinho(produto, event) { 
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) {
        
      // 1. Mostra o feedback
        if (!usuario) {
            mostrarFeedback('Você precisa fazer login para continuar.', 'aviso');
        } else {
            alert('Você precisa fazer login para continuar.');
        }

      // 2. ESPERA um pouco antes de redirecionar
        setTimeout(() => {
            window.location.href = `/paginas/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        }, 4000); // Espera 4000 milissegundos (4 segundos)

        return false;
    }

    // Não precisamos mais procurar o produto, já o recebemos!
    if (!produto) {
        console.warn(`Objeto do produto não foi fornecido para adicionar ao carrinho.`);
        return;
    }

    const itemExistente = carrinho.find(item => (item.id || item._id) === (produto.id || produto._id));

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({
            id: produto.id || produto._id,
            nome: produto.nome,
            preco: produto.preco,
            imagem: produto.foto || produto.fotos?.[0] || config.placeholderImage,
            quantidade: 1,
            vendedor: {
                nome: produto.vendedor?.nome || 'Vendedor',
                email: produto.vendedor?.email || 'Email não informado',
                telefone: produto.vendedor?.telefone || 'Telefone não informado'
            }
        });
    }

    // Chama a função que salva e atualiza a tela
    persistirCarrinho();
    mostrarFeedback(`${produto.nome} adicionado ao carrinho!`);

    return true;
}

// Funções auxiliares
function persistirCarrinho() {
  localStorage.setItem(getChaveCarrinho(), JSON.stringify(carrinho));
  atualizarCarrinhoUI();
}

function atualizarCarrinhoUI() {
  updateListaItens();
  updateTotal();
  updateContador();
}

function updateListaItens() {
  const lista = document.getElementById('lista-carrinho');
  if (!lista) return;

  lista.innerHTML = carrinho.map((item) => `
    <div class="item-carrinho">
      <img src="${item.imagem}" alt="${item.nome}" class="img-detalhes" data-id="${item.id}">
      <div class="produto-info-carrinho">
        <h4 class="link-detalhes" data-id="${item.id}">${item.nome}</h4>
        <p class="produto-preco-carrinho">${item.quantidade}x R$ ${item.preco.toFixed(2).replace('.', ',')}</p>
        <button class="btn-remover" title="Remover produto" data-id="${item.id}">Remover</button>
      </div>
    </div>
  `).join('');

  // ✅ Evento de redirecionar pelo nome
  document.querySelectorAll('.link-detalhes').forEach(el => {
    el.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      if (id) {
        window.location.href = `../paginas/detalhes-produto.html?id=${id}`;
      }
    });
  });

  // ✅ Evento de redirecionar pela imagem
  document.querySelectorAll('.img-detalhes').forEach(img => {
    img.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      if (id) {
        window.location.href = `../paginas/detalhes-produto.html?id=${id}`;
      }
    });
  });
}

function updateTotal() {
  const totalElement = document.getElementById('total-carrinho');
  if (totalElement) {
    const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    totalElement.textContent = `Total: R$ ${total.toFixed(2).replace('.', ',')}`;
  }
}

function updateContador() {
  const contador = document.getElementById('contador-carrinho');
  if (contador) {
    const quantidade = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
    contador.textContent = quantidade;
    contador.style.display = quantidade > 0 ? 'block' : 'none';
  }
}

// Remover 1 unidade de um produto
export function removerUmaUnidade(produtoId) {
  const index = carrinho.findIndex(item => item.id === produtoId);
  if (index !== -1) {
    const produto = carrinho[index];

    if (produto.quantidade > 1) {
      produto.quantidade -= 1;
      mostrarFeedback(`1 unidade de ${produto.nome} removida do carrinho.`);
    } else {
      carrinho.splice(index, 1);
      mostrarFeedback(`${produto.nome} removido do carrinho.`, 'aviso');
    }

    persistirCarrinho();
  }
}

// Limpar carrinho inteiro
export function limparCarrinho() {
  carrinho = [];
  persistirCarrinho();
  mostrarFeedback('Carrinho limpo com sucesso!');
}

// Funções de UI
function toggleCarrinho(e) {
  e.stopPropagation();
  document.getElementById('carrinho-dropdown')?.classList.toggle('show');
}

function fecharCarrinho(e) {
  const dropdown = document.getElementById('carrinho-dropdown');
  const clicouNoCarrinho = e.target.closest('.carrinho-dropdown, .carrinho-icone');
  if (dropdown && !clicouNoCarrinho) {
    dropdown.classList.remove('show');
  }
}

function getChaveCarrinho() {
  const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
  if (usuario && usuario.email) {
    return `carrinho_${usuario.email}`;
  }
  return 'carrinho_anonimo';
}