import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('../server/public/assets');
const indexHtml = path.resolve('../server/public/index.html');

if (fs.existsSync(assetsDir)) {
  fs.rmSync(assetsDir, { recursive: true, force: true });
  console.log('Cleaned old assets directory');
}
if (fs.existsSync(indexHtml)) {
  fs.rmSync(indexHtml, { force: true });
  console.log('Cleaned old index.html');
}
