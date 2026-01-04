document.addEventListener('DOMContentLoaded', () => {
    const saudacaoEl = document.getElementById('saudacao');
    const linkMinhaConta = document.getElementById('link-minha-conta');
    const linkLogin = document.getElementById('link-login');
    const linkLogout = document.getElementById('link-logout');
    const btnLogoutMenu = document.getElementById('btn-logout-menu');
    const iconeCarrinho = document.getElementById('icone-carrinho');

    if (!saudacaoEl) return;

    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (usuario && usuario.nome) {
        const nomeFinal = usuario.nome.split(' ')[0];
        saudacaoEl.textContent = `Olá, ${nomeFinal}!`;

        linkMinhaConta?.classList.add('visivel');
        linkLogout?.classList.add('visivel');
        iconeCarrinho?.classList.add('visivel');

        btnLogoutMenu?.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('usuarioLogado');

            if (typeof window.mostrarFeedback === 'function') {
                window.mostrarFeedback('Saindo da sua conta...', 'aviso');
                setTimeout(() => {
                    window.location.href = '/paginas/login.html';
                }, 3000);
            } else {
                window.location.href = '/paginas/login.html';
            }
        });

    } else {
        saudacaoEl.textContent = 'Bem-vindo(a)!';
        linkLogin?.classList.add('visivel');
    }
});