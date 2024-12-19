import { Request, Response } from "express";
import { client } from "../db/posgres";
import stripe from "./Stripe.Services";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
    throw new Error('Stripe secret key is not defined');
}

export const handlePaymentStatus = async (
    paymentIntent: Stripe.PaymentIntent,
    orderId: string
): Promise<void> => {
    try {
        let dbStatus: string;
        
        switch (paymentIntent.status) {
            case 'requires_payment_method':
                dbStatus = 'pending';
                break;
            
            case 'requires_confirmation':
                dbStatus = 'awaiting_confirmation';
                break;
            
            case 'requires_action':
                dbStatus = 'requires_authentication';
                break;
            
            case 'processing':
                dbStatus = 'processing';
                break;
            
            case 'succeeded':
                dbStatus = 'completed';
                break;
            
            case 'canceled':
                dbStatus = 'cancelled';
                break;

            
            default:
                dbStatus = 'pending';
        }

        // Update payment status in database
        await client.query(
            `UPDATE payments 
             SET status = $1, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE order_id = $2 AND 
                   stripe_payment_intent_id = $3`,
            [dbStatus, orderId, paymentIntent.id]
        );

        // If payment succeeded, update order status
        if (paymentIntent.status === 'succeeded') {
            await client.query(
                `UPDATE orders 
                 SET status = 'paid', 
                     updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $1`,
                [orderId]
            );
        }

        // If payment failed, update order status
        if (paymentIntent.status === 'requires_payment_method') {
            await client.query(
                `UPDATE orders 
                 SET status = 'payment_failed', 
                     updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $1`,
                [orderId]
            );
        }

    } catch (error) {
        console.error('Error updating payment status:', error);
        throw error;
    }
};

// Webhook handler to process status updates
export const handleStripeWebhook = async (
    req: Request,
    res: Response
): Promise<any> => {
    const sig = req.headers['stripe-signature'] as string | string[] | Buffer;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret) {
        throw new Error('Stripe webhook secret is not defined');
    }

    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            endpointSecret
        );

        switch (event.type) {
            case 'payment_intent.succeeded':
            case 'payment_intent.payment_failed':
            case 'payment_intent.canceled':
            case 'payment_intent.processing':
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                // Get order ID from metadata
                const orderId = paymentIntent.metadata.order_id;
                await handlePaymentStatus(paymentIntent, orderId);
                break;
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({
            error: 'Webhook error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};