import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize official @google/genai client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Route for AI Contact Analysis
app.post('/api/ai/contact-insight', async (req, res) => {
  try {
    const { contact, customInstruction } = req.body;

    if (!contact || !contact.name) {
      return res.status(400).json({ error: 'Dados do contato são obrigatórios.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Chave GEMINI_API_KEY não configurada no ambiente do servidor.',
      });
    }

    const prompt = `
Você é um especialista em vendas B2B e CRM corporativo (Agente de Inteligência Artificial para análise e conversão de leads).
Analise os seguintes dados do cliente cadastrado no CRM:

- Nome: ${contact.name}
- E-mail: ${contact.email || 'Não informado'}
- Telefone: ${contact.phone || 'Não informado'}
- Status no Funil: ${contact.status}
- Prioridade: ${contact.priority}
- Valor Estimado da Oportunidade: R$ ${contact.estimated_value || '0.00'}
- Histórico / Observações: ${contact.notes || 'Nenhuma observação prévia registrada.'}
${customInstruction ? `- Instrução Adicional do Vendedor: ${customInstruction}` : ''}

Com base nas melhores práticas comerciais (SPIN Selling, Closer mindset, gatilhos de valor e urgência):
1. Forneça uma análise aprofundada do perfil do cliente e da oportunidade.
2. Estime a probabilidade de fechamento justificando a pontuação.
3. Liste recomendações práticas para a próxima ação.
4. Crie um modelo de mensagem completo e pronto para WhatsApp (com quebras de linha amigáveis e tom consultivo).
5. Crie um modelo completo de E-mail comercial (assunto persuasivo e corpo da mensagem).

Retorne estritamente o JSON conforme o schema especificado.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            profile_analysis: {
              type: Type.STRING,
              description: 'Análise detalhada do perfil do cliente, momento da negociação e pontos fortes/fracos.',
            },
            closing_probability: {
              type: Type.STRING,
              description: 'Ex: "Alta (80%)", "Média (55%)" ou "Baixa (30%)", acompanhado de breve justificativa.',
            },
            probability_level: {
              type: Type.STRING,
              description: 'Um dos valores: "Alta", "Média" ou "Baixa".',
            },
            key_recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Lista de 3 a 4 recomendações práticas e imediatas para o vendedor.',
            },
            whatsapp_message: {
              type: Type.STRING,
              description: 'Mensagem formatada e humanizada pronta para ser enviada pelo WhatsApp.',
            },
            email_subject: {
              type: Type.STRING,
              description: 'Assunto do e-mail comercial atraente e com alta taxa de abertura.',
            },
            email_body: {
              type: Type.STRING,
              description: 'Corpo completo do e-mail com saudação, proposta de valor, chamada para ação e despedida.',
            },
          },
          required: [
            'profile_analysis',
            'closing_probability',
            'probability_level',
            'key_recommendations',
            'whatsapp_message',
            'email_subject',
            'email_body',
          ],
        },
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      parsedData = {
        profile_analysis: responseText,
        closing_probability: 'Média (50%)',
        probability_level: 'Média',
        key_recommendations: ['Entrar em contato para qualificar a oportunidade.'],
        whatsapp_message: `Olá ${contact.name}, tudo bem? Gostaria de alinhar os próximos passos da nossa proposta.`,
        email_subject: `Próximos passos - Oportunidade com ${contact.name}`,
        email_body: `Olá ${contact.name},\n\nEspero que esteja bem.\n\nGostaria de entender como podemos avançar com nosso alinhamento.\n\nAtenciosamente.`,
      };
    }

    return res.json({ insight: parsedData });
  } catch (error: any) {
    console.error('Erro na rota /api/ai/contact-insight:', error);
    return res.status(500).json({
      error: error.message || 'Erro ao gerar análise com Gemini AI.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
