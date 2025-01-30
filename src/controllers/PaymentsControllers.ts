import { Request, Response } from "express";
import stripe from "../helpers/Stripe.Services";
import { configDotenv } from "dotenv";
import supabase from "../db/db";
configDotenv();

//Get all payments
export const getPayments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    const userCookiesId = req.cookies.id;
    console.log("Cookie received:", userCookiesId);

    if (!userCookiesId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user_id = JSON.parse(userCookiesId).id;

    // First get all orders for the user
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', user_id);

    if (ordersError) {
      throw ordersError;
    }

    if (!orders || orders.length === 0) {
      res.status(200).json({ payments: [] });
      return;
    }

    // Then get all payments for those orders
    const orderIds = orders.map(order => order.id);
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .in('order_id', orderIds);

    if (paymentsError) {
      throw paymentsError;
    }

    res.status(200).json({ payments });
    } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({
      error: "Failed to get payments",
      details: error instanceof Error ? error.message : "Unknown error",
    });
    }
};

export const createPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      currency = "USD",
      status = "pending",
      metadata,
      test_mode = true,
      error_message,
      refund_status,
      refunded_amount = 0,
    } = req.body;

    const order_id = req.params.orderId;

    // Get customer email from order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', order.user_id)
      .single();

    if (userError || !user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Create a test clock for testing scenarios
    const testClock = await stripe.testHelpers.testClocks.create({
      frozen_time: Math.floor(Date.now() / 1000),
    });

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: user.email,
      test_clock: testClock.id,
    });

    // Create a payment method using Stripe test token
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        token: "tok_visa",
      },
    });

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: stripeCustomer.id,
    });

    // Set as default payment method
    await stripe.customers.update(stripeCustomer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    const amount = Math.round(order.total_amount * 100);
    console.log("amount in cents:", amount);
    
    if (amount <= 0) {
      res.status(400).json({ message: "Invalid order amount" });
      return;
    }

    if (refunded_amount > amount) {
      res.status(400).json({
        message: "Refunded amount cannot exceed order amount",
      });
      return;
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      customer: stripeCustomer.id,
      payment_method: paymentMethod.id,
      payment_method_types: ["card"],
      metadata: metadata || {},
      confirm: true,
      off_session: true,
    });

    // Insert payment record using Supabase
    const { data: payment, error: insertError } = await supabase
      .from('payments')
      .insert([{
        order_id,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_test_clock_id: testClock.id,
        stripe_customer_id: stripeCustomer.id,
        stripe_payment_method_id: paymentMethod.id,
        amount,
        currency: currency.toUpperCase(),
        status: paymentIntent.status,
        payment_method_type: "card",
        metadata: metadata || null,
        test_mode,
        error_message,
        refund_status,
        refunded_amount,
      }])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    res.status(201).json({
      payment,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    res.status(500).json({
      error: "Failed to create payment",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

//update
export const updatePayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id;
    const {
      currency,
      status,
      metadata,
      test_mode,
      error_message,
      refund_status,
      refunded_amount,
    } = req.body;

    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        currency,
        status,
        metadata,
        test_mode,
        error_message,
        refund_status,
        refunded_amount,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }


    if (!payment) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }

    res.status(200).json({ payment });
  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({
      error: "Failed to update payment",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

//get by id
export const getPaymentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id;

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      throw error;
    }
    if (!payment) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }

    res.status(200).json({ payment });
  } catch (error) {
    console.error("Get payment by ID error:", error);
    res.status(500).json({
      error: "Failed to get payment",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

//delete
export const deletePayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id;

    const {data, error} = await supabase
      .from('payments')
      .delete()
      .eq('id', id);


    if (error) {
      throw error;
    }

    if (data === 0) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }

    res.status(204).json({ deleted: true });
  } catch (error) {
    console.error("Delete payment error:", error);
    res.status(500).json({
      error: "Failed to delete payment",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

//payments by order
export const getPaymentsByOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const order_id = req.params.orderId;

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', order_id);

    if (error) {
      throw error;
    }

    res.status(200).json({ payments: payments });
  } catch (error) {
    console.error("Get payments by order error:", error);
    res.status(500).json({
      error: "Failed to get payments",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
