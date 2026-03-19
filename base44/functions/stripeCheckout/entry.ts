import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

const PRICES = {
  starter: 'price_1TCV5AEQJJJd4TDBbX0YYezv',
  pro: 'price_1TCV5AEQJJJd4TDBVycK5zV4',
  professional: 'price_1TCV5AEQJJJd4TDB3Hy8cSEW',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, successUrl, cancelUrl } = await req.json();

    const priceId = PRICES[plan];
    if (!priceId) {
      return Response.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      success_url: successUrl || `${req.headers.get('origin')}/Dashboard?subscribed=true`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/Landing`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        user_id: user.id,
        plan,
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});