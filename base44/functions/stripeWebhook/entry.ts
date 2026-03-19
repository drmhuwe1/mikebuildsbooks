import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const PRICE_TO_PLAN = {
  'price_1TCV5AEQJJJd4TDBbX0YYezv': 'starter',
  'price_1TCV5AEQJJJd4TDBVycK5zV4': 'pro',
  'price_1TCV5AEQJJJd4TDB3Hy8cSEW': 'professional',
};

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userEmail = session.customer_email;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      const plan = session.metadata?.plan || 'starter';

      if (userEmail && subscriptionId) {
        // Upsert subscription record
        const existing = await base44.asServiceRole.entities.Subscription.filter({ user_email: userEmail });
        if (existing.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
            plan, status: 'active',
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
          });
        } else {
          await base44.asServiceRole.entities.Subscription.create({
            user_email: userEmail,
            plan, status: 'active',
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
          });
        }
        console.log(`Activated ${plan} plan for ${userEmail}`);
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object;
      const priceId = sub.items?.data?.[0]?.price?.id;
      const plan = PRICE_TO_PLAN[priceId] || 'starter';
      const status = sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'cancelled';

      const existing = await base44.asServiceRole.entities.Subscription.filter({ stripe_subscription_id: sub.id });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
          plan, status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const existing = await base44.asServiceRole.entities.Subscription.filter({ stripe_subscription_id: sub.id });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, { status: 'cancelled' });
      }
    }

  } catch (err) {
    console.error('Webhook handler error:', err.message);
  }

  return Response.json({ received: true });
});