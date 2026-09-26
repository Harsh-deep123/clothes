import * as esbuild from 'esbuild';
import { mkdirSync } from 'fs';
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

console.log('Bundled Vercel API -> api/index.js');
