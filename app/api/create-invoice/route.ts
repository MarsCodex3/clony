import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { z } from 'zod';

// Validate environment variables
const validateEnv = () => {
  const requiredEnvVars = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate Stripe key format
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey?.startsWith('sk_')) {
    throw new Error('Invalid Stripe secret key format. Must start with "sk_"');
  }
};

try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error);
  throw error;
}

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

const createInvoiceSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  clientEmail: z.string().email('Invalid email address'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long')
});

export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const body = await req.json();
    
    // Validate input
    const validatedData = createInvoiceSchema.parse(body);
    
    // Test Stripe connection
    try {
      await stripe.paymentMethods.list({ limit: 1 });
    } catch (stripeError) {
      console.error('Stripe connection test failed:', stripeError);
      return NextResponse.json(
        { 
          error: 'Stripe configuration error',
          message: 'Unable to connect to Stripe. Please check your configuration.'
        },
        { status: 500 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Invoice Payment',
              description: validatedData.description,
            },
            unit_amount: Math.round(validatedData.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
      customer_email: validatedData.clientEmail,
    });

    if (!session?.url) {
      throw new Error('Failed to generate Stripe checkout session URL');
    }

    // Create invoice record
    const invoice = await prisma.invoice.create({
      data: {
        amount: validatedData.amount,
        clientEmail: validatedData.clientEmail,
        description: validatedData.description,
        paymentLink: session.url,
        status: 'pending',
      },
    });

    return NextResponse.json({ 
      success: true, 
      invoice,
      paymentUrl: session.url 
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.errors.map(e => ({
            field: e.path[0],
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    if (error instanceof Stripe.errors.StripeError) {
      const errorMessage = error.message || 'Stripe payment processing error';
      const errorCode = error.statusCode || 500;
      
      return NextResponse.json(
        { 
          error: 'Stripe error',
          message: errorMessage,
          code: error.code
        },
        { status: errorCode }
      );
    }

    return NextResponse.json(
      { 
        error: 'Server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}