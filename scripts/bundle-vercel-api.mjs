import * as esbuild from 'esbuild';
import { cpSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(path.join(root, 'api'), { recursive: true });

await esbuild.build({
  entryPoints: [path.join(root, 'scripts/vercel-api-entry.ts')],
  outfile: path.join(root, 'api/index.js'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: false,
  logLevel: 'info',
  external: [
    'mongodb',
    'twilio',
    '@google/genai',
    'stripe',
    'nodemailer',
    'bcryptjs',
    'jsonwebtoken',
    'express',
    'dotenv',
  ],
});

// Keep a copy next to the serverless entry so fallback catalog is always readable on Vercel.
const catalogSrc = path.join(root, 'server', 'data');
const catalogDest = path.join(root, 'api', 'data');
if (existsSync(catalogSrc)) {
  mkdirSync(catalogDest, { recursive: true });
  cpSync(catalogSrc, catalogDest, { recursive: true });
  console.log('Copied catalog fallback -> api/data');
}

console.log('Bundled Vercel API -> api/index.js');
