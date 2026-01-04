// Vercel Web Analytics and Speed Insights
(function() {
    // Initialize the analytics queue before loading scripts
    // This needs to be set up BEFORE the script is loaded
    window.vaq = window.vaq || [];
    
    // Create the va function that will buffer calls
    window.va = window.va || function () { 
        window.vaq.push(arguments); 
    };
    
    // Load Vercel Web Analytics script
    var analyticsScript = document.createElement('script');
    analyticsScript.defer = true;
    analyticsScript.src = '/_vercel/insights/script.js';
    
    // Load Vercel Speed Insights script
    var speedScript = document.createElement('script');
    speedScript.defer = true;
    speedScript.src = '/_vercel/speed-insights/script.js';
    
    // Insert both scripts before the first script tag
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(analyticsScript, firstScript);
    firstScript.parentNode.insertBefore(speedScript, firstScript);
})();