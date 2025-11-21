// assets/js/pages/login.js

// Importa a função de feedback que já temos
import { mostrarFeedback } from '../modules/ui.js';

// --- PONTO DE ENTRADA PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    
    // --- LÓGICA DO MODAL "ESQUECI SENHA" ---
    const modalEsqueci = document.getElementById('modal-esqueci-senha');
    const abrirEsqueci = document.getElementById('link-esqueci-senha');
    const fecharEsqueci = document.getElementById('fechar-esqueci-senha');
    const formEsqueci = document.getElementById('form-esqueci-senha');

    if (abrirEsqueci && modalEsqueci) {
        abrirEsqueci.addEventListener('click', (e) => {
            e.preventDefault();
            modalEsqueci.classList.remove('hidden'); // PADRÃO: remove hidden para mostrar
        });
    }

    if (fecharEsqueci && modalEsqueci) {
        fecharEsqueci.addEventListener('click', () => {
            modalEsqueci.classList.add('hidden'); // PADRÃO: adiciona hidden para esconder
        });
    }

    if (formEsqueci) {
        formEsqueci.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email-esqueci').value;
            try {
                const res = await fetch(`/api?rota=perfil/esqueci-senha`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });
                const data = await res.json();
                mostrarFeedback(data.message || 'Link enviado com sucesso!', res.ok ? 'sucesso' : 'erro');
            } catch (error) {
                mostrarFeedback('Erro na requisição.', 'erro');
            }
            if (modalEsqueci) modalEsqueci.classList.add('hidden');
        });
    }

    // --- LÓGICA DO MODAL "REDEFINIR SENHA" ---
    const modalRedefinir = document.getElementById('modal-redefinir-senha');
    const fecharRedefinir = document.getElementById('fechar-redefinir-senha');
    const formRedefinir = document.getElementById('form-redefinir-senha');

    if (fecharRedefinir && modalRedefinir) {
        fecharRedefinir.addEventListener('click', () => {
            modalRedefinir.classList.add('hidden'); // PADRÃO: adiciona hidden para esconder
        });
    }

    if (formRedefinir) {
        formRedefinir.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = document.getElementById('input-token').value.trim();
            const senha = document.getElementById('nova-senha').value;
            const confirmarSenha = document.getElementById('confirma-nova-senha').value;

            if (senha !== confirmarSenha) {
                mostrarFeedback('As senhas não conferem.', 'erro');
                return;
            }

            try {
                const res = await fetch(`/api?rota=perfil/resetar-senha&token=${encodeURIComponent(token)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ senha }),
                });
                const data = await res.json();
                mostrarFeedback(data.message || 'Senha redefinida!', res.ok ? 'sucesso' : 'erro');
                if (res.ok) {
                    setTimeout(() => modalRedefinir.classList.add('hidden'), 2000);
                }
            } catch {
                mostrarFeedback('Erro na requisição.', 'erro');
            }
        });
    }

    // --- VERIFICA SE VEIO TOKEN NA URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token && modalRedefinir) {
        const inputToken = document.getElementById('input-token');
        if (inputToken) inputToken.value = token;
        
        modalRedefinir.classList.remove('hidden'); // PADRÃO: remove hidden para mostrar

        // Limpa a URL para não deixar o token exposto
        history.replaceState(null, '', window.location.pathname);
    }
});