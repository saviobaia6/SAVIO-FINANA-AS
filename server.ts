import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

const ChatRequestSchema = z.object({
  prompt: z.string().min(1).max(1500),
  summaryContext: z.object({
    period: z.string(),
    scope: z.string(),
    totalBalance: z.number(),
    totalIncome: z.number(),
    totalExpense: z.number(),
    netResult: z.number(),
    cpfIncome: z.number(),
    cpfExpense: z.number(),
    cnpjIncome: z.number(),
    cnpjExpense: z.number(),
    pendingBoletosCount: z.number(),
    pendingBoletosTotal: z.number(),
    overdueBoletosCount: z.number(),
    topExpenseCategories: z.array(z.object({ category: z.string(), total: z.number() })),
    upcomingBoletos: z.array(z.object({
      beneficiary: z.string(),
      dueDate: z.string(),
      amount: z.number(),
      entity: z.string(),
    })),
    cardsSummary: z.array(z.object({
      cardName: z.string(),
      entity: z.string(),
      currentInvoice: z.number(),
      limit: z.number(),
    })),
    totalDebt: z.number(),
  }),
});

const ParseDocumentSchema = z.object({
  textContent: z.string().max(30000).optional(),
  fileName: z.string().max(255).optional(),
  fileData: z
    .object({
      mimeType: z.string().regex(/^(application\/pdf|image\/(png|jpeg|jpg|webp))$/),
      base64: z.string().min(10),
    })
    .optional(),
});

const ExtractedDocResultSchema = z.object({
  description: z.string().min(1),
  amount: z.number().nonnegative(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().min(1),
  entity: z.enum(['CPF', 'CNPJ']),
  direction: z.enum(['INCOME', 'EXPENSE']),
  confidenceNote: z.string().optional(),
});

const ParseBoletoRequestSchema = z.object({
  linhaDigitavel: z.string().optional(),
  textContent: z.string().max(15000).optional(),
  fileData: z
    .object({
      mimeType: z.string().regex(/^(application\/pdf|image\/(png|jpeg|jpg|webp))$/),
      base64: z.string().min(10),
    })
    .optional(),
});

const ExtractedBoletoSchema = z.object({
  beneficiario: z.string().min(1),
  pagador: z.string().min(1),
  instituicao: z.string().min(1),
  linhaDigitavel: z.string().default(''),
  vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  valorOriginal: z.number().nonnegative(),
  descricao: z.string().min(1),
  entityId: z.enum(['CPF', 'CNPJ']).default('CPF'),
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, aiConfigured: Boolean(ai) });
  });

  // AI Chat endpoint grounded in aggregated financial summary
  app.post('/api/ai/chat', async (req, res) => {
    const parsedBody = ChatRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ error: 'Dados inválidos na solicitação de chat.' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Assistente de IA indisponível: configure GEMINI_API_KEY nos segredos do servidor.',
      });
    }

    try {
      const { prompt, summaryContext } = parsedBody.data;
      const systemInstruction =
        'Você é o assistente financeiro executivo do SAVIO FINANÇAS (FINANCE IA). ' +
        'Responda em português, de forma clara, objetiva e fundamentada EXCLUSIVAMENTE nos números agregados fornecidos abaixo. ' +
        'Nunca invente saldos, datas ou valores. Se faltar algum dado no resumo, informe claramente o que não consta.\n\n' +
        `Resumo financeiro do período (${summaryContext.period}, escopo ${summaryContext.scope}):\n` +
        JSON.stringify(summaryContext, null, 2);

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      res.json({ reply: response.text || 'Não foi possível gerar uma resposta no momento.' });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao processar IA';
      console.error('AI Chat Error:', msg);
      res.status(500).json({ error: msg });
    }
  });

  // AI Multimodal Document Parser (PDF or Image + Zod validation)
  app.post('/api/ai/parse-document', async (req, res) => {
    const parsedBody = ParseDocumentSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ error: 'Envie um arquivo PDF/imagem válido ou texto para leitura.' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Leitor inteligente indisponível: configure GEMINI_API_KEY no servidor. Você ainda pode cadastrar manualmente.',
      });
    }

    try {
      const { textContent, fileName, fileData } = parsedBody.data;
      const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [];

      if (fileData) {
        parts.push({
          inlineData: {
            mimeType: fileData.mimeType,
            data: fileData.base64,
          },
        });
      }

      parts.push({
        text:
          `Extraia os dados financeiros do documento anexado (${fileName || 'documento'}). ` +
          `Não invente valores; se algum dado estiver ilegível, use 0 para amount ou a data de hoje (${new Date().toISOString().split('T')[0]}) e explique em confidenceNote.\n` +
          (textContent ? `Texto adicional:\n${textContent}` : ''),
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              date: { type: Type.STRING, description: 'Data no formato YYYY-MM-DD' },
              category: { type: Type.STRING },
              entity: { type: Type.STRING, enum: ['CPF', 'CNPJ'] },
              direction: { type: Type.STRING, enum: ['INCOME', 'EXPENSE'] },
              confidenceNote: { type: Type.STRING },
            },
            required: ['description', 'amount', 'date', 'category', 'entity', 'direction'],
          },
        },
      });

      const rawJson = JSON.parse((response.text ?? '{}').trim());
      const validated = ExtractedDocResultSchema.safeParse(rawJson);
      if (!validated.success) {
        return res.status(422).json({ error: 'Não foi possível validar os campos extraídos do documento.' });
      }

      res.json({ extracted: validated.data });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao analisar documento';
      console.error('Parse doc error:', msg);
      res.status(500).json({ error: msg });
    }
  });

  // AI Boleto Analyzer (Zod + Gemini Multimodal)
  app.post('/api/ai/parse-boleto', async (req, res) => {
    const parsedBody = ParseBoletoRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ error: 'Dados inválidos para análise de boleto.' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Análise por IA indisponível: configure GEMINI_API_KEY no servidor. A validação matemática da linha digitável continua funcionando.',
      });
    }

    try {
      const { linhaDigitavel, textContent, fileData } = parsedBody.data;
      const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [];
      if (fileData) {
        parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.base64 } });
      }
      parts.push({
        text: `Analise o boleto bancário (linha digitável: ${linhaDigitavel || 'N/A'}; texto: ${textContent || 'N/A'}) e extraia beneficiário, pagador, instituição, linha digitável, vencimento (YYYY-MM-DD), valorOriginal, descrição e vínculo (CPF ou CNPJ). Nunca invente valores não presentes.`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              beneficiario: { type: Type.STRING },
              pagador: { type: Type.STRING },
              instituicao: { type: Type.STRING },
              linhaDigitavel: { type: Type.STRING },
              vencimento: { type: Type.STRING },
              valorOriginal: { type: Type.NUMBER },
              descricao: { type: Type.STRING },
              entityId: { type: Type.STRING, enum: ['CPF', 'CNPJ'] },
            },
            required: ['beneficiario', 'pagador', 'instituicao', 'vencimento', 'valorOriginal', 'descricao', 'entityId'],
          },
        },
      });

      const rawJson = JSON.parse((response.text ?? '{}').trim());
      const validated = ExtractedBoletoSchema.safeParse(rawJson);
      if (!validated.success) {
        return res.status(422).json({ error: 'Não foi possível validar os campos do boleto.' });
      }

      res.json({ boleto: validated.data });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao analisar boleto';
      console.error('Parse boleto error:', msg);
      res.status(500).json({ error: msg });
    }
  });

  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve('dist'))) {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FINANCE IA server running on port ${PORT}`);
  });
}

startServer();
