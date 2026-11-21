import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { z } from 'zod';
import { APP_CATEGORIES, OPERATION_TYPES } from './src/types';

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

function isTransientAiError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED')
  );
}

function formatAiErrorResponse(err: unknown): { status: number; message: string } {
  const msg = err instanceof Error ? err.message : 'Erro ao processar solicitação com IA.';
  if (msg.includes('503') || msg.includes('UNAVAILABLE')) {
    return {
      status: 503,
      message: 'O serviço de IA está temporariamente sobrecarregado (503). Tente novamente em alguns instantes.',
    };
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'Limite de requisições da IA atingido no momento (429). Aguarde alguns segundos e tente novamente.',
    };
  }
  return { status: 500, message: msg };
}

async function generateWithRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts && isTransientAiError(err)) {
        const delayMs = 600 * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

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
    upcomingBoletos: z.array(
      z.object({
        beneficiary: z.string(),
        dueDate: z.string(),
        amount: z.number(),
        entity: z.string(),
      })
    ),
    cardsSummary: z.array(
      z.object({
        cardName: z.string(),
        entity: z.string(),
        currentInvoice: z.number(),
        limit: z.number(),
      })
    ),
    totalDebt: z.number(),
  }),
});

const ParseDocumentSchema = z
  .object({
    textContent: z.string().max(30000).optional(),
    fileName: z.string().max(255).optional(),
    knownAccounts: z
      .array(
        z.object({
          institutionName: z.string(),
          accountName: z.string(),
          entityId: z.enum(['CPF', 'CNPJ']),
        })
      )
      .optional(),
    fileData: z
      .object({
        mimeType: z.string().regex(/^(application\/pdf|image\/(png|jpeg|jpg|webp))$/),
        base64: z.string().min(10),
      })
      .optional(),
  })
  .refine((data) => Boolean(data.textContent || data.fileData), {
    message: 'Envie um arquivo PDF/imagem válido ou texto para leitura.',
  });

const ExtractedDocItemSchema = z.object({
  description: z.string().min(1),
  amount: z.number().nonnegative(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.enum(APP_CATEGORIES),
  entity: z.enum(['CPF', 'CNPJ']),
  direction: z.enum(['INCOME', 'EXPENSE']),
  operationType: z.enum(OPERATION_TYPES),
  counterparty: z.string().default(''),
  externalId: z.string().default(''),
  isInternalTransfer: z.boolean().default(false),
  originAccountHint: z.string().default(''),
  destinationAccountHint: z.string().default(''),
  confidence: z.number().min(0).max(1),
  confidenceNote: z.string().optional(),
});

const ExtractedDocBatchSchema = z.object({
  transactions: z.array(ExtractedDocItemSchema).min(1),
});

const ParseBoletoRequestSchema = z
  .object({
    linhaDigitavel: z.string().optional(),
    textContent: z.string().max(15000).optional(),
    fileData: z
      .object({
        mimeType: z.string().regex(/^(application\/pdf|image\/(png|jpeg|jpg|webp))$/),
        base64: z.string().min(10),
      })
      .optional(),
  })
  .refine((data) => Boolean(data.linhaDigitavel?.trim() || data.textContent?.trim() || data.fileData), {
    message: 'Informe a linha digitável, texto ou arquivo do boleto.',
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
        'Você é o assistente financeiro executivo do FINANCE IA. ' +
        'Responda em português, de forma clara, objetiva e fundamentada EXCLUSIVAMENTE nos números agregados fornecidos abaixo. ' +
        'Nunca invente saldos, datas ou valores. Se faltar algum dado no resumo, informe claramente o que não consta.\n\n' +
        `Resumo financeiro do período (${summaryContext.period}, escopo ${summaryContext.scope}):\n` +
        JSON.stringify(summaryContext, null, 2);

      const response = await generateWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            systemInstruction,
          },
        })
      );

      res.json({ reply: response.text || 'Não foi possível gerar uma resposta no momento.' });
    } catch (error: unknown) {
      const formatted = formatAiErrorResponse(error);
      console.error('AI Chat Error:', formatted.message);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // AI Multimodal Document Parser (PDF or Image -> Array of structured transactions validated by Zod)
  app.post('/api/ai/parse-document', async (req, res) => {
    const parsedBody = ParseDocumentSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ error: 'Envie um arquivo PDF/imagem válido ou texto para leitura.' });
    }

    if (!ai) {
      return res.status(503).json({
        error:
          'Leitor inteligente indisponível: configure GEMINI_API_KEY no servidor. Você ainda pode cadastrar manualmente.',
      });
    }

    try {
      const { textContent, fileName, fileData, knownAccounts } = parsedBody.data;
      const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [];

      if (fileData) {
        parts.push({
          inlineData: {
            mimeType: fileData.mimeType,
            data: fileData.base64,
          },
        });
      }

      const today = new Date().toISOString().split('T')[0];
      const accountsText =
        knownAccounts && knownAccounts.length > 0
          ? knownAccounts.map((a) => `- ${a.institutionName} (${a.accountName}) [${a.entityId}]`).join('\n')
          : 'Nenhuma conta informada.';

      const instruction = `Extraia TODOS os lançamentos financeiros visíveis no documento/extrato/comprovante anexado (${fileName || 'documento'}) no formato de array "transactions".
Regras obrigatórias:
1. Para cada lançamento, classifique "operationType" conforme as definições:
   - PIX: transferências ou pagamentos via Pix, chave Pix, QR Code Pix, ou com ID End-to-End (E...).
   - TED_DOC: transferências bancárias TED ou DOC entre bancos para terceiros.
   - BOLETO: pagamento de boletos, títulos bancários, guias DAS/DARF/GPS ou contas de consumo por código de barras.
   - CARTAO: compras no crédito ou débito, pagamento de fatura de cartão, lançamentos com bandeira/NSU.
   - TRANSFERENCIA_PROPRIA: transferência entre contas do mesmo titular (inclusive entre CPF e CNPJ do mesmo usuário, ou aplicações/resgates entre suas contas listadas abaixo).
   - SAQUE: retirada em dinheiro em caixa eletrônico / terminal de autoatendimento.
   - TARIFA: tarifas bancárias, IOF, anuidade, juros ou encargos financeiros.
   - OUTRO: qualquer operação que não se enquadre nos itens anteriores.
2. Classifique "category" EXCLUSIVAMENTE dentro desta lista exata: ${APP_CATEGORIES.join(', ')}. Use "Transferência" quando for TRANSFERENCIA_PROPRIA e "Outros" se nenhuma categoria específica servir.
3. Contas conhecidas do usuário:
${accountsText}
   Se tanto a origem quanto o destino corresponderem às contas do próprio usuário (ou houver menção de "mesma titularidade" entre contas próprias), defina operationType="TRANSFERENCIA_PROPRIA" e isInternalTransfer=true. Caso contrário, isInternalTransfer=false.
4. Preencha "counterparty" com o nome/razão social de quem pagou ou recebeu (se não visível, retorne string vazia "").
5. Preencha "externalId" com o ID da transação quando houver (ex.: ID E2E do Pix iniciado por E..., NSU ou código de autenticação; se não existir, retorne "").
6. Preencha "originAccountHint" e "destinationAccountHint" com banco/titular de origem e destino quando identificáveis (ou "").
7. Preencha "confidence" de 0.0 a 1.0 refletindo o grau de certeza na leitura dos campos e explique qualquer dúvida em "confidenceNote".
8. Nunca invente valores: se um valor estiver ilegível use 0 e reduza confidence; se a data estiver ilegível use ${today} e explique em confidenceNote.
${textContent ? `\nTexto adicional:\n${textContent}` : ''}`;

      parts.push({ text: instruction });

      const response = await generateWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                transactions: {
                  type: Type.ARRAY,
                  description: 'Lista de todos os lançamentos financeiros extraídos do documento.',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      description: { type: Type.STRING },
                      amount: { type: Type.NUMBER },
                      date: { type: Type.STRING, description: 'Data no formato YYYY-MM-DD' },
                      category: { type: Type.STRING, enum: [...APP_CATEGORIES] },
                      entity: { type: Type.STRING, enum: ['CPF', 'CNPJ'] },
                      direction: { type: Type.STRING, enum: ['INCOME', 'EXPENSE'] },
                      operationType: { type: Type.STRING, enum: [...OPERATION_TYPES] },
                      counterparty: { type: Type.STRING },
                      externalId: { type: Type.STRING },
                      isInternalTransfer: { type: Type.BOOLEAN },
                      originAccountHint: { type: Type.STRING },
                      destinationAccountHint: { type: Type.STRING },
                      confidence: { type: Type.NUMBER, description: 'Grau de confiança entre 0.0 e 1.0' },
                      confidenceNote: { type: Type.STRING },
                    },
                    required: [
                      'description',
                      'amount',
                      'date',
                      'category',
                      'entity',
                      'direction',
                      'operationType',
                      'counterparty',
                      'externalId',
                      'isInternalTransfer',
                      'confidence',
                    ],
                  },
                },
              },
              required: ['transactions'],
            },
          },
        })
      );

      const rawJson = JSON.parse((response.text ?? '{}').trim());
      const validated = ExtractedDocBatchSchema.safeParse(rawJson);
      if (!validated.success) {
        return res.status(422).json({
          error: 'Não foi possível validar os lançamentos extraídos do documento.',
        });
      }

      res.json({ transactions: validated.data.transactions });
    } catch (error: unknown) {
      const formatted = formatAiErrorResponse(error);
      console.error('Parse doc error:', formatted.message);
      res.status(formatted.status).json({ error: formatted.message });
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
        error:
          'Análise por IA indisponível: configure GEMINI_API_KEY no servidor. A validação matemática da linha digitável continua funcionando.',
      });
    }

    try {
      const { linhaDigitavel, textContent, fileData } = parsedBody.data;
      const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [];
      if (fileData) {
        parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.base64 } });
      }
      parts.push({
        text: `Analise o boleto bancário (linha digitável: ${linhaDigitavel || 'N/A'}; texto: ${
          textContent || 'N/A'
        }) e extraia beneficiário, pagador, instituição, linha digitável, vencimento (YYYY-MM-DD), valorOriginal, descrição e vínculo (CPF ou CNPJ). Nunca invente valores não presentes.`,
      });

      const response = await generateWithRetry(() =>
        ai.models.generateContent({
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
        })
      );

      const rawJson = JSON.parse((response.text ?? '{}').trim());
      const validated = ExtractedBoletoSchema.safeParse(rawJson);
      if (!validated.success) {
        return res.status(422).json({ error: 'Não foi possível validar os campos do boleto.' });
      }

      res.json({ boleto: validated.data });
    } catch (error: unknown) {
      const formatted = formatAiErrorResponse(error);
      console.error('Parse boleto error:', formatted.message);
      res.status(formatted.status).json({ error: formatted.message });
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
