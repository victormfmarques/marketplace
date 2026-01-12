// api/index.js
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
import produtosListar from './_modulos/produtos/listar.js';
import adminListarUsuarios from './_modulos/admin/listarUsuarios.js';
import adminMudarCargo from './_modulos/admin/mudarCargo.js';
import adminExcluirUsuario from './_modulos/admin/excluirUsuario.js';
import adminAtualizarUsuario from './_modulos/admin/atualizarUsuario.js';
import vendedorPerfil from './_modulos/vendedor/perfil.js';
import vendedorAtualizarVendedor from './_modulos/vendedor/atualizarVendedor.js';
import perfilVerificarSessao from './_modulos/perfil/verificarSessao.js';
import listarPedidosVendedor from './_modulos/vendedor/listarPedidos.js';
import atualizarStatusPedido from './_modulos/vendedor/atualizarStatus.js';
import { produtosEditarHandler } from './_modulos/produtos/editar.js';
import perfilConfirmarEmail from './_modulos/perfil/confirmar-email.js';
import reenviarConfirmacao from './_modulos/perfil/reenviar-confirmacao.js';

export default async function handler(req, res) {
    const rota = req.query.rota;
    console.log(`🔍 API chamada: rota=${rota}, método=${req.method}, url=${req.url}`);

    if (!rota) return res.status(400).json({ error: "Rota não especificada" });

    // --- PRODUTOS EDITAR ---
    if (rota === "produtos/editar") return produtosEditarHandler(req, res);

    // --- Feedback ---
    if (rota === "feedback/registrar") return feedbackRegistrar(req, res);

    // --- Perfil ---
    if (rota === "perfil/atualizar") return perfilAtualizar(req, res);
    if (rota === "perfil/cadastro") return perfilCadastro(req, res);
    if (rota === "perfil/cancelarPedido") return perfilCancelarPedido(req, res);
    if (rota === "perfil/esqueci-senha") return perfilEsqueciSenha(req, res);
    if (rota === "perfil/excluirConta") return perfilExcluirConta(req, res);
    if (rota === "perfil/login") return perfilLogin(req, res);
    if (rota === "perfil/pedidos") return perfilPedidos(req, res);
    if (rota === "perfil/produtos-usuario") return perfilProdutosUsuario(req, res);
    if (rota === "perfil/resetar-senha") return perfilResetarSenha(req, res);
    if (rota === "perfil/verificarSessao") return perfilVerificarSessao(req, res);
    if (rota === "perfil/confirmar-email") return perfilConfirmarEmail(req, res);
    if (rota === "perfil/reenviar-confirmacao") return reenviarConfirmacao(req, res);

    // --- Produtos ---
    if (rota === "produtos/cadastro") return produtosCadastro(req, res);
    if (rota === "produtos/detalhes") return produtosDetalhes(req, res);
    if (rota === "produtos/listar") return produtosListar(req, res);

    // --- Admin ---
    if (rota === "admin/listarUsuarios") return adminListarUsuarios(req, res);
    if (rota === "admin/mudarCargo") return adminMudarCargo(req, res);
    if (rota === "admin/excluirUsuario") return adminExcluirUsuario(req, res);
    if (rota === "admin/atualizarUsuario") return adminAtualizarUsuario(req, res);

    // --- Vendedor ---
    if (rota === "vendedor/perfil") return vendedorPerfil(req, res);
    if (rota === "vendedor/atualizarVendedor") return vendedorAtualizarVendedor(req, res);
    if (rota === "vendedor/listarPedidos") return listarPedidosVendedor(req, res);
    if (rota === "vendedor/atualizarStatus") return atualizarStatusPedido(req, res);

    // --- CASO NÃO ENCONTRE ROTA ---
    res.status(404).json({ error: "Rota não encontrada" });
}