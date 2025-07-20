import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { shopDomain } = req.body;

    if (!shopDomain) {
      return res.status(400).json({ message: 'Shop domain is required' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'echoSignal Pro',
              description: 'AI-powered Shopify analytics and insights',
            },
            unit_amount: 1999, // $19.99 in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}&shop=${shopDomain}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?shop=${shopDomain}`,
      metadata: {
        shopDomain,
      },
      customer_email: undefined, // Will be filled by Stripe Checkout
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}