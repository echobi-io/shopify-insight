import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { shop } = req.query;

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ message: 'Shop domain is required' });
    }

    const supabase = createClient(req, res);

    // Check subscription status in database
    const { data: subscription, error } = await supabase
      .from('subscription')
      .select('status, stripe_subscription_id')
      .eq('shop_domain', shop)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Database error' });
    }

    const isActive = subscription?.status === 'active';

    res.status(200).json({
      isActive,
      status: subscription?.status || 'inactive',
      subscriptionId: subscription?.stripe_subscription_id,
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}