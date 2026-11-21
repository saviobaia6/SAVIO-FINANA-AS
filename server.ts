import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // AI Chat endpoint grounded in financial data
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { prompt, financialState } = req.body;
      if (!ai) {
        return res.json({
          reply: 'Chave GEMINI_API_KEY não configurada. Configure a chave nos segredos da IA para ativar a assistente inteligente baseada em seus dados reais.'
        });
      }

      const systemInstruction = `Você é a inteligência artificial financeira executiva da plataforma FINANCE IA. Responda de forma clara, prestativa, profissional e baseada estritamente nos dados financeiros fornecidos a seguir. Nunca invente valores ou informações.\n\nDados financeiros atuais do usuário:\n${JSON.stringify(financialState, null, 2)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\nPergunta do usuário: ${prompt}` }] }
        ]
      });

      res.json({ reply: response.text || 'Não foi possível gerar uma resposta no momento.' });
    } catch (error: any) {
      console.error('AI Chat Error:', error);
      res.status(500).json({ error: error.message || 'Erro ao processar IA' });
    }
  });

  // AI Document Parser
  app.post('/api/ai/parse-document', async (req, res) => {
    try {
      const { textContent, fileName } = req.body;
      if (!ai) {
        return res.json({
          extracted: {
            description: fileName || 'Documento importado',
            amount: 150.00,
            date: new Date().toISOString().split('T')[0],
            category: 'Outros',
            entity: 'CPF',
            direction: 'EXPENSE'
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{
              text: `Analise o texto do documento financeiro abaixo e extraia em JSON os seguintes campos:
              - description (string)
              - amount (number)
              - date (string no formato YYYY-MM-DD)
              - category (string entre: Salário, Moradia, Alimentação, Transporte, Serviço MEI, Cartão, Outros)
              - entity ('CPF' ou 'CNPJ')
              - direction ('INCOME' ou 'EXPENSE')
              Responda APENAS com o JSON válido sem marcações markdown se possível.\n\nTexto:\n${textContent}`
            }]
          }
        ]
      });

      let jsonText = response.text || '{}';
      jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonText);
      res.json({ extracted: parsed });
    } catch (error: any) {
      console.error('Parse doc error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Boleto Analyzer
  app.post('/api/ai/parse-boleto', async (req, res) => {
    try {
      const { linhaDigitavel, textContent } = req.body;
      if (!ai) {
        return res.json({
          boleto: {
            beneficiario: 'Empresa Beneficiária Exemplo',
            pagador: 'Área do usuário (FINANCE IA)',
            instituicao: 'Banco Inter',
            linhaDigitavel: linhaDigitavel || '23793.38128 60000.123456 78901.234567 1 89120000015000',
            vencimento: '2026-11-30',
            valorOriginal: 150.00,
            descricao: 'Boleto / Cobrança importada'
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{
              text: `Analise os dados do boleto bancário (linha digitável: ${linhaDigitavel || 'N/A'} ou texto: ${textContent || 'N/A'}) e extraia em JSON os campos: beneficiario, pagador, instituicao, linhaDigitavel, vencimento (YYYY-MM-DD), valorOriginal (number), descricao. Responda APENAS com o JSON válido.`
            }]
          }
        ]
      });

      let jsonText = response.text || '{}';
      jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonText);
      res.json({ boleto: parsed });
    } catch (error: any) {
      console.error('Parse boleto error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FINANCE IA server running on port ${PORT}`);
  });
}

startServer();
