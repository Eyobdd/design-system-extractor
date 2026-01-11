import fs from 'fs';
import path from 'path';
import {
  surfaceColors,
  textColors,
  borderColors,
  fontSizes,
  spacing,
  radii,
} from '../src/primitives/index';
import { generateCSSVariables } from '../src/css/generate';

const allTokens = {
  ...surfaceColors,
  ...textColors,
  ...borderColors,
  ...fontSizes,
  ...spacing,
  ...radii,
};

const css = generateCSSVariables(allTokens as Record<string, string | number>);
const distDir = path.resolve(__dirname, '../dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

fs.writeFileSync(path.resolve(distDir, 'tokens.css'), css);
console.log('CSS variables generated at dist/tokens.css');
