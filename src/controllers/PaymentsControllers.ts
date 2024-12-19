import { Request, Response } from "express";
import { client } from "../db/posgres";
import stripe from "../helpers/Stripe.Services";
import { configDotenv } from "dotenv";
configDotenv();


//Get all payments
export const getPayments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await client.query("SELECT * FROM payments");
    res.status(200).json({ payments: result.rows });
    return;
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({
      error: "Failed to get payments",
      details: error instanceof Error ? error.message : "Unknown error",
    });
    return;
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
    const customer = await client.query("SELECT * FROM orders WHERE id = $1", [
      order_id,
    ]);
    if(customer.rows.length === 0) {
        res.status(404).json({ message: "Order not found" });
    }
    
    const email = await client.query("SELECT email from users WHERE id = $1", [customer.rows[0].user_id]);
    if(email.rows.length === 0) {
        res.status(404).json({ message: "User not found" });
    }
    // Create a test clock for testing scenarios
    const testClock = await stripe.testHelpers.testClocks.create({
      frozen_time: Math.floor(Date.now() / 1000),
    });

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: email.rows[0].email,
      test_clock: testClock.id, // Associate customer with test clock
    });

    // Create a payment method using Stripe test token
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        token: "tok_visa", // Using Stripe's test token instead of raw card data
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

    // Validate order exists and get amount
    const orderResult = await client.query(
      "SELECT total_amount FROM orders WHERE id = $1",
      [order_id]
    );

    if (orderResult.rows.length === 0) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const amount = orderResult.rows[0].total_amount; // Convert to smallest currency unit
    console.log("amount in decimal:", amount);

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
      confirm: true, // Automatically confirm the payment
      off_session: true, // Since this is a server-side confirmation
    });

    // Insert payment record
    const result = await client.query(
      `INSERT INTO payments(
                order_id,
                stripe_payment_intent_id,
                stripe_test_clock_id,
                stripe_customer_id,
                stripe_payment_method_id,
                amount,
                currency,
                status,
                payment_method_type,
                metadata,
                test_mode,
                error_message,
                refund_status,
                refunded_amount
            )
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *`,
      [
        order_id,
        paymentIntent.id,
        testClock.id,
        stripeCustomer.id,
        paymentMethod.id,
        amount,
        currency.toUpperCase(),
        paymentIntent.status, // Use the status from Stripe
        "card",
        metadata ? JSON.stringify(metadata) : null,
        test_mode,
        error_message,
        refund_status,
        refunded_amount,
      ]
    );

    res.status(201).json({
      payment: result.rows[0],
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

    const result = await client.query(
      `UPDATE payments
            SET currency = $1,
                status = $2,
                metadata = $3,
                test_mode = $4,
                error_message = $5,
                refund_status = $6,
                refunded_amount = $7
            WHERE id = $8
            RETURNING *`,
      [
        currency,
        status,
        metadata,
        test_mode,
        error_message,
        refund_status,
        refunded_amount,
        id,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }

    res.status(200).json({ payment: result.rows[0] });
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

    const result = await client.query("SELECT * FROM payments WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }

    res.status(200).json({ payment: result.rows[0] });
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

    const result = await client.query("DELETE FROM payments WHERE id = $1", [
      id,
    ]);

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }

    res.status(204).json({deleted: true});
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

    const result = await client.query(
      "SELECT * FROM payments WHERE order_id = $1",
      [order_id]
    );

    res.status(200).json({ payments: result.rows });
  } catch (error) {
    console.error("Get payments by order error:", error);
    res.status(500).json({
      error: "Failed to get payments",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
