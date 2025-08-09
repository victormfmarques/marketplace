import fs from 'fs';
import path from 'path';

const pastaFront = 'paginas/'; // ajuste conforme seu projeto

const rotasMap = {
  '/api/feedback/registrar': '/api?rota=feedback/registrar',
  '/api/perfil/atualizar': '/api?rota=perfil/atualizar',
  '/api/perfil/cadastro': '/api?rota=perfil/cadastro',
  '/api/perfil/cancelarPedido': '/api?rota=perfil/cancelarPedido',
  '/api/perfil/esqueci-senha': '/api?rota=perfil/esqueci-senha',
  '/api/perfil/excluirConta': '/api?rota=perfil/excluirConta',
  '/api/perfil/login': '/api?rota=perfil/login',
  '/api/perfil/pedidos': '/api?rota=perfil/pedidos',
  '/api/perfil/produtos-usuario': '/api?rota=perfil/produtos-usuario',
  '/api/perfil/resetar-senha': '/api?rota=perfil/resetar-senha',
  '/api/produtos/cadastro': '/api?rota=produtos/cadastro',
  '/api/produtos/detalhes': '/api?rota=produtos/detalhes',
  '/api/produtos/editar': '/api?rota=produtos/editar',
  '/api/produtos/listar': '/api?rota=produtos/listar',
};

function processarArquivo(caminhoArquivo) {
  let texto = fs.readFileSync(caminhoArquivo, 'utf8');
  let textoOriginal = texto;

  for (const [antigo, novo] of Object.entries(rotasMap)) {
    const regex = new RegExp(antigo.replace(/\//g, '\\/'), 'g');
    texto = texto.replace(regex, novo);
  }

  if (texto !== textoOriginal) {
    fs.writeFileSync(caminhoArquivo, texto, 'utf8');
    console.log(`Arquivo atualizado: ${caminhoArquivo}`);
  }
}

function processarPasta(pasta) {
  const arquivos = fs.readdirSync(pasta, { withFileTypes: true });
  for (const arquivo of arquivos) {
    const caminhoCompleto = path.join(pasta, arquivo.name);
    if (arquivo.isDirectory()) {
      processarPasta(caminhoCompleto);
    } else if (
      arquivo.name.endsWith('.js') ||
      arquivo.name.endsWith('.html') ||
      arquivo.name.endsWith('.htm')
    ) {
      processarArquivo(caminhoCompleto);
    }
  }
}

processarPasta(pastaFront);
