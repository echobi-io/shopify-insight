import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

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

    // Check subscription status in database
    const subscription = await prisma.subscription.findUnique({
      where: { shopDomain: shop },
    });

    const isActive = subscription?.status === 'active';

    res.status(200).json({
      isActive,
      status: subscription?.status || 'inactive',
      subscriptionId: subscription?.stripeSubscriptionId,
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}