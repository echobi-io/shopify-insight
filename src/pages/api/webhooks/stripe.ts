import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { buffer } from 'micro';
import prisma from '@/lib/prisma';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ message: 'Webhook signature verification failed' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const shopDomain = session.metadata?.shopDomain;
        
        if (shopDomain && session.mode === 'subscription') {
          // Store subscription information in your database
          await prisma.subscription.upsert({
            where: { shopDomain },
            update: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              status: 'active',
              updatedAt: new Date(),
            },
            create: {
              shopDomain,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          
          console.log(`Subscription activated for shop: ${shopDomain}`);
        }
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        
        // Update subscription status in database
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status,
            updatedAt: new Date(),
          },
        });
        
        console.log(`Subscription ${subscription.id} status updated to: ${subscription.status}`);
        break;

      case 'invoice.payment_failed':
        const invoice = event.data.object;
        
        // Handle failed payment - you might want to notify the user
        console.log(`Payment failed for subscription: ${invoice.subscription}`);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ message: 'Webhook handler error' });
  }
}