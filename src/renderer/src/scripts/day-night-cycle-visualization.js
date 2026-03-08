function updateDayNightVisualization(time)
{
    const sun = document.getElementById('sun');
    const moon = document.getElementById('moon');
    const dayNightVisualization = document.getElementById('day-night-visualization');
    const dayNightVisualizationWrapper = document.getElementById('day-night-visualization-wrapper');
    const sunSize = 50;
    const visualizationWidth = dayNightVisualization.offsetWidth;
    const visualizationHeight = dayNightVisualization.offsetHeight;
    const centerX = visualizationWidth / 2;
    const centerY = visualizationHeight / 2;
    const radiusX = visualizationWidth / 2 ;
    const radiusY = visualizationHeight / 2;

    const angle = (time % 24) * (Math.PI / 12);
    const x = (centerX - sunSize/2) + (radiusX - sunSize/2) * Math.cos(angle);
    const y = (centerY - sunSize/2) + (radiusY - sunSize/2) * Math.sin(angle);

    sun.style.left = `${x}px`;
    sun.style.top = `${y}px`;
    moon.style.left = `${visualizationWidth - x - sunSize}px`;
    moon.style.top = `${visualizationHeight - y - sunSize}px`;

    dayNightVisualization.style.background = 
    `radial-gradient(circle at center, 
    rgba(${0}, ${110}, ${255}, ${Math.max(Math.sin(-angle)/3, 0)}), 
    rgba(${1}, ${100}, ${240}, ${Math.max(0.8 * Math.sin(-angle)/3, 0)}))`;
    dayNightVisualizationWrapper.style.boxShadow = 
    `0 0 30px rgba(0, 110, 255, ${Math.max(Math.sin(-angle)/3, 0)})`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateDayNightCycle() 
{
    let time = 0;
    while (true) {
        updateDayNightVisualization(time);
        time += 0.1;
        await sleep(50);
    }
}
