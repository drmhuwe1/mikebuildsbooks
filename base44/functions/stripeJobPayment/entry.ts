import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, jobId, jobTitle, clientName } = await req.json();

    // Fetch user's Stripe keys from AppSettings
    const settings = await base44.asServiceRole.entities.AppSettings.filter({ 
      settings_key: "global",
      created_by: user.email
    });

    const userSettings = settings[0];
    if (!userSettings?.stripe_secret_key || !userSettings?.stripe_publishable_key) {
      return Response.json({ 
        error: 'Stripe keys not configured. Please add your Stripe API keys in Settings.' 
      }, { status: 400 });
    }

    // Initialize Stripe with user's own secret key
    const stripe = new Stripe(userSettings.stripe_secret_key);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Payment for: ${jobTitle}`,
              description: `Client: ${clientName || 'N/A'}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      success_url: `${req.headers.get('origin')}/Jobs?payment=success&job=${jobId}`,
      cancel_url: `${req.headers.get('origin')}/Jobs?payment=cancelled&job=${jobId}`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        jobId,
        jobTitle,
        clientName,
        userId: user.id,
        userEmail: user.email,
      },
    });

    console.log(`Created Stripe session for job ${jobId}: ${session.id}`);

    return Response.json({ sessionUrl: session.url });
  } catch (error) {
    console.error('Stripe job payment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});