// Vercel Speed Insights
(function() {
    // Cria a queue ANTES de tudo
    window.vaq = window.vaq || [];
    
    // Depois cria a função
    window.va = window.va || function () { 
        window.vaq.push(arguments); 
    };
    
    // Carrega o script
    var script = document.createElement('script');
    script.defer = true;
    script.src = '/_vercel/speed-insights/script.js';
    
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);
})();