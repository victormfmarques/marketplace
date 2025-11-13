// Vercel Speed Insights
(function() {
    // Inicializa a queue antes de qualquer coisa
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    
    // Carrega o script de forma assíncrona
    var script = document.createElement('script');
    script.defer = true;
    script.src = '/_vercel/speed-insights/script.js';
    
    // Adiciona ao head para carregar o mais cedo possível
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);
})();