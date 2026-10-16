import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve('CRM/Backend/package.json'));
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');

dotenv.config({ path: path.resolve('CRM/Backend/.env') });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  try {
    const list = await ai.models.list();
    console.log('Available Models in Account:');
    for await (const m of list) {
      console.log(`- ${m.name}`);
    }
  } catch (err) {
    console.error('List models error:', err.message);
  }
}

listModels();
