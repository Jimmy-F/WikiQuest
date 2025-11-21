import { Router, Request, Response } from 'express';
import { supabase } from '../server';

const router = Router();

// Create or get user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingUser) {
      return res.json({ user: existingUser });
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email: null,
        username: null,
        display_name: null,
        total_xp: 0,
        current_level: 1,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: new Date().toISOString().split('T')[0],
        subscription_tier: 'free',
        subscription_status: 'inactive',
        settings: {
          quiz_frequency: 2,
          notifications_enabled: true,
          auto_review_enabled: true
        }
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ user: newUser });
  } catch (error: any) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
