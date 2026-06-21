import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { count } from 'drizzle-orm';
import { db } from './db';
import { waitlist } from './db/schema';
import waitlistRouter from './routes/waitlist';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ── Middlewares ───────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '16kb' }));

// ── Health check ─────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Rotas ─────────────────────────────────────────────────────────────
app.use('/waitlist', waitlistRouter);

// GET /admin/leads?secret= — exporta todos os leads em JSON
app.get('/admin/leads', async (req: Request, res: Response): Promise<void> => {
  if (req.query.secret !== process.env.ADMIN_SECRET) {
    res.status(403).json({ error: 'Acesso não autorizado.' });
    return;
  }

  try {
    const leads = await db
      .select({
        id: waitlist.id,
        name: waitlist.name,
        email: waitlist.email,
        profile: waitlist.profile,
        createdAt: waitlist.createdAt,
      })
      .from(waitlist)
      .orderBy(waitlist.createdAt);

    res.json({ total: leads.length, leads });
  } catch (err) {
    console.error('[GET /admin/leads]', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── 404 handler ───────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// ── Error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled error]', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// ── Start ─────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ FitAI API rodando em http://0.0.0.0:${PORT}`);
});
