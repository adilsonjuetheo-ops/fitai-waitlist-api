import { Router, Request, Response } from 'express';
import { z } from 'zod';
import postgres from 'postgres';
import { count } from 'drizzle-orm';
import { db } from '../db';
import { waitlist } from '../db/schema';

const router = Router();

const submitSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres.'),
  email: z.string().email('Formato de e-mail inválido.'),
  profile: z.enum(['user', 'personal', 'gym'], {
    errorMap: () => ({ message: 'Perfil inválido. Use: user, personal ou gym.' }),
  }),
});

// POST /waitlist — insere lead e retorna posição na fila
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = submitSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.errors[0].message,
    });
    return;
  }

  const { name, email, profile } = parsed.data;

  try {
    await db.insert(waitlist).values({ name, email, profile });

    const [{ total }] = await db
      .select({ total: count() })
      .from(waitlist);

    res.status(201).json({
      success: true,
      position: Number(total),
    });
  } catch (err) {
    if (err instanceof postgres.PostgresError && err.code === '23505') {
      res.status(409).json({
        success: false,
        error: 'Este e-mail já está cadastrado na lista de espera.',
      });
      return;
    }
    console.error('[POST /waitlist]', err);
    res.status(500).json({ success: false, error: 'Erro interno. Tente novamente.' });
  }
});

// GET /waitlist/count?secret= — contador público para a landing page
router.get('/count', async (req: Request, res: Response): Promise<void> => {
  if (req.query.secret !== process.env.ADMIN_SECRET) {
    res.status(403).json({ error: 'Acesso não autorizado.' });
    return;
  }

  try {
    const [{ total }] = await db
      .select({ total: count() })
      .from(waitlist);

    res.json({ count: Number(total) });
  } catch (err) {
    console.error('[GET /waitlist/count]', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default router;
