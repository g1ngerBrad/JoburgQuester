const fs = require('fs');
const path = require('path');

const token = process.env.MAPBOX_TOKEN || '';
const output = `const MAPBOX_TOKEN = ${JSON.stringify(token)};\n`;

fs.writeFileSync(path.join(__dirname, '..', 'js', 'env.js'), output);
console.log('Injected MAPBOX_TOKEN into js/env.js');
