import { Router, Request, Response } from 'express';
import { supabase } from '../server';

const router = Router();

// Get all achievements
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    res.json({ achievements: data });
  } catch (error: any) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's achievements
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('user_achievements')
      .select('*, achievements(*)')
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ userAchievements: data });
  } catch (error: any) {
    console.error('Error fetching user achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
