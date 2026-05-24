const fs = require('fs');
const path = require('path');

const mapboxToken = process.env.MAPBOX_TOKEN || '';
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

const output = [
  `const MAPBOX_TOKEN = ${JSON.stringify(mapboxToken)};`,
  `const SUPABASE_URL = ${JSON.stringify(supabaseUrl)};`,
  `const SUPABASE_ANON_KEY = ${JSON.stringify(supabaseAnonKey)};`,
  ''
].join('\n');

fs.writeFileSync(path.join(__dirname, '..', 'js', 'env.js'), output);
console.log('Injected MAPBOX_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY into js/env.js');
