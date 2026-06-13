// config.js
// CATATAN: API Key Groq hanya digunakan di server (groq-proxy.php), bukan di sini


// Chart.js Global Config
Chart.defaults.color = '#f8fafc';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.weight = '600';
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(255, 255, 255, 0.9)';
Chart.defaults.plugins.tooltip.titleColor = '#0f172a';
Chart.defaults.plugins.tooltip.bodyColor = '#334155';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.5)';
Chart.defaults.plugins.tooltip.borderWidth = 1;

const gridConfig = {
    color: 'rgba(255, 255, 255, 0.1)',
    drawBorder: false
};
