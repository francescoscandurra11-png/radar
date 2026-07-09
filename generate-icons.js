const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size, maskable = false) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(0.5, '#1d4ed8');
    gradient.addColorStop(1, '#0f172a');
    
    if (maskable) {
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
    } else {
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(0, 0, size, size, size * 0.15);
        ctx.fill();
    }
    
    // Radar circles
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = size * 0.008;
    for (let r = 0.4; r <= 0.8; r += 0.1) {
        ctx.beginPath();
        ctx.arc(size/2, size/2, size * r, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Radar sweep
    ctx.save();
    ctx.translate(size/2, size/2);
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.4);
    glowGradient.addColorStop(0, 'rgba(229, 57, 53, 1)');
    glowGradient.addColorStop(0.7, 'rgba(29, 78, 216, 0.5)');
    glowGradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, size * 0.4, -Math.PI/2, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.rotate(-Math.PI/4);
    ctx.strokeStyle = '#e53935';
    ctx.lineWidth = size * 0.012;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size * 0.4, -size * 0.4);
    ctx.stroke();
    ctx.restore();
    
    // Center point
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.arc(size/2, size/2, size * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = size * 0.008;
    ctx.stroke();
    
    // T.F.R text
    if (size >= 128) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${size * 0.07}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('T.F.R', size/2, size * 0.93);
    }
    
    return canvas;
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const maskableSizes = [192, 512];

// Generate standard icons
sizes.forEach(size => {
    const canvas = createIcon(size, false);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`icon-${size}.png`, buffer);
    console.log(`Generated icon-${size}.png`);
});

// Generate maskable icons
maskableSizes.forEach(size => {
    const canvas = createIcon(size, true);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`icon-maskable-${size}.png`, buffer);
    console.log(`Generated icon-maskable-${size}.png`);
});

console.log('All icons generated successfully!');