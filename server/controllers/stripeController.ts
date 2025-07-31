/**
 * Stripe Controller - Payment Processing
 * 
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key (sk_test_... or sk_live_...)
 * - STRIPE_WEBHOOK_SECRET: Stripe webhook endpoint secret for signature verification
 * - VITE_STRIPE_PUBLIC_KEY: Your Stripe publishable key (pk_test_... or pk_live_...) - for frontend
 */

import { Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "../storage";

// Initialize Stripe
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-07-30.basil",
  });
} else {
  console.warn('⚠️  STRIPE_SECRET_KEY not set - payment features will be disabled');
}

// Create checkout session
export async function createCheckoutSession(req: Request, res: Response) {
  try {
    if (!stripe) {
      return res.status(503).json({ 
        message: "Serviço de pagamento indisponível - Stripe não configurado" 
      });
    }

    const userId = (req as any).user.userId;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Create or get Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        metadata: {
          userId: user.id,
          accessKey: user.accessKey,
        },
      });
      
      stripeCustomerId = customer.id;
      await storage.updateUserStripeInfo(user.id, stripeCustomerId, null);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'TrainManager Pro - Plano Professional',
              description: 'Gestão completa de treinamentos corporativos',
              images: ['https://your-domain.com/logo.png'], // Add your logo URL
            },
            unit_amount: 10000, // R$100.00 em centavos
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.protocol}://${req.get('host')}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/billing?canceled=true`,
      metadata: {
        userId: user.id,
      },
      subscription_data: {
        trial_period_days: 7, // 7 days free trial
        metadata: {
          userId: user.id,
          accessKey: user.accessKey,
        },
      },
    });

    res.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    res.status(500).json({ 
      message: "Erro ao criar sessão de pagamento",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Create customer portal session
export async function createPortalSession(req: Request, res: Response) {
  try {
    if (!stripe) {
      return res.status(503).json({ 
        message: "Serviço de pagamento indisponível - Stripe não configurado" 
      });
    }

    const userId = (req as any).user.userId;
    const user = await storage.getUser(userId);
    
    if (!user || !user.stripeCustomerId) {
      return res.status(400).json({ 
        message: "Usuário não possui assinatura ativa" 
      });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${req.protocol}://${req.get('host')}/billing`,
    });

    res.json({
      url: session.url,
    });

  } catch (error: any) {
    console.error("Stripe portal error:", error);
    res.status(500).json({ 
      message: "Erro ao criar portal de cobrança",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Get subscription status
export async function getSubscriptionStatus(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    let subscriptionData = {
      status: user.subscriptionStatus || 'trial',
      trialEndsAt: user.trialEndsAt,
      subscriptionEndsAt: user.subscriptionEndsAt,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
    };

    // If user has Stripe subscription, get fresh data
    if (stripe && user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        subscriptionData = {
          ...subscriptionData,
          status: subscription.status as any,
          subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
        };
        
        // Update local database with fresh data
        await storage.updateSubscriptionStatus(
          user.id, 
          subscription.status as any, 
          new Date(subscription.current_period_end * 1000)
        );
        
      } catch (error) {
        console.error("Error fetching Stripe subscription:", error);
      }
    }

    res.json(subscriptionData);

  } catch (error) {
    console.error("Get subscription status error:", error);
    res.status(500).json({ message: "Erro ao buscar status da assinatura" });
  }
}

// Stripe webhook handler
export async function handleWebhook(req: Request, res: Response) {
  try {
    if (!stripe) {
      return res.status(503).json({ message: "Stripe não configurado" });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return res.status(400).json({ message: "Webhook signature missing" });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;
        
        if (userId) {
          await storage.updateUserStripeInfo(userId, subscription.customer as string, subscription.id);
          
          let status = 'active';
          if (subscription.status === 'trialing') status = 'trial';
          else if (subscription.status === 'canceled') status = 'canceled';
          else if (subscription.status === 'past_due') status = 'expired';
          
          await storage.updateSubscriptionStatus(
            userId, 
            status, 
            new Date(subscription.current_period_end * 1000)
          );
          
          console.log(`✅ Subscription ${subscription.status} for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;
        
        if (userId) {
          await storage.updateSubscriptionStatus(userId, 'canceled');
          console.log(`❌ Subscription canceled for user ${userId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = subscription.metadata.userId;
          
          if (userId) {
            await storage.updateSubscriptionStatus(
              userId, 
              'active', 
              new Date(subscription.current_period_end * 1000)
            );
            console.log(`💰 Payment succeeded for user ${userId}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = subscription.metadata.userId;
          
          if (userId) {
            await storage.updateSubscriptionStatus(userId, 'expired');
            console.log(`⚠️  Payment failed for user ${userId}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ message: "Webhook error" });
  }
}