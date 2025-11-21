import { Router, Request, Response } from 'express';
import { supabase } from '../server';

const router = Router();

// Get active quests
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('daily_quests')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    res.json({ quests: data });
  } catch (error: any) {
    console.error('Error fetching quests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user quest progress
router.get('/progress/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const { data, error} = await supabase
      .from('user_quest_progress')
      .select('*, daily_quests(*)')
      .eq('user_id', userId)
      .gte('period_end', today);

    if (error) throw error;

    res.json({ progress: data });
  } catch (error: any) {
    console.error('Error fetching quest progress:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
