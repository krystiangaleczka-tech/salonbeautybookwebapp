const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng(inputPath, outputPath, width, height) {
    try {
        await sharp(inputPath)
            .resize(width, height)
            .png()
            .toFile(outputPath);
        
        console.log(`✅ Pomyślnie przekonwertowano ${inputPath} do ${outputPath} (${width}x${height}px)`);
        
        // Sprawdź rozmiar pliku
        const stats = fs.statSync(outputPath);
        console.log(`📊 Rozmiar pliku: ${(stats.size / 1024).toFixed(2)} KB`);
        
        return true;
    } catch (error) {
        console.error(`❌ Błąd konwersji: ${error.message}`);
        return false;
    }
}

// Konwersja logo
const inputSvg = path.join(__dirname, 'assets', 'salon-beauty-book-logo.svg');
const outputPng = path.join(__dirname, 'assets', 'salon-beauty-book-logo.png');

convertSvgToPng(inputSvg, outputPng, 120, 120);
