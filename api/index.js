import feedbackRegistrar from './_modulos/feedback/registrar.js';
import perfilAtualizar from './_modulos/perfil/atualizar.js';
import perfilCadastro from './_modulos/perfil/cadastro.js';
import perfilCancelarPedido from './_modulos/perfil/cancelarPedido.js';
import perfilEsqueciSenha from './_modulos/perfil/esqueci-senha.js';
import perfilExcluirConta from './_modulos/perfil/excluirConta.js';
import perfilLogin from './_modulos/perfil/login.js';
import perfilPedidos from './_modulos/perfil/pedidos.js';
import perfilProdutosUsuario from './_modulos/perfil/produtos-usuario.js';
import perfilResetarSenha from './_modulos/perfil/resetar-senha.js';
import produtosCadastro from './_modulos/produtos/cadastro.js';
import produtosDetalhes from './_modulos/produtos/detalhes.js';
import produtosEditar from './_modulos/produtos/editar.js';
import produtosListar from './_modulos/produtos/listar.js';

export default async function handler(req, res) {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  // Feedback
  if (pathname === "/api/feedback/registrar") return feedbackRegistrar(req, res);

  // Perfil
  if (pathname === "/api/perfil/atualizar") return perfilAtualizar(req, res);
  if (pathname === "/api/perfil/cadastro") return perfilCadastro(req, res);
  if (pathname === "/api/perfil/cancelarPedido") return perfilCancelarPedido(req, res);
  if (pathname === "/api/perfil/esqueci-senha") return perfilEsqueciSenha(req, res);
  if (pathname === "/api/perfil/excluirConta") return perfilExcluirConta(req, res);
  if (pathname === "/api/perfil/login") return perfilLogin(req, res);
  if (pathname === "/api/perfil/pedidos") return perfilPedidos(req, res);
  if (pathname === "/api/perfil/produtos-usuario") return perfilProdutosUsuario(req, res);
  if (pathname === "/api/perfil/resetar-senha") return perfilResetarSenha(req, res);

  // Produtos
  if (pathname === "/api/produtos/cadastro") return produtosCadastro(req, res);
  if (pathname === "/api/produtos/detalhes") return produtosDetalhes(req, res);
  if (pathname === "/api/produtos/editar") return produtosEditar(req, res);
  if (pathname === "/api/produtos/listar") return produtosListar(req, res);

  // Caso não encontre rota
  res.status(404).json({ error: "Rota não encontrada" });
}
