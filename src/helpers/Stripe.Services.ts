import Stripe from 'stripe'
import { configDotenv } from 'dotenv';
configDotenv();

const stripe = new Stripe(process.env.SECRET_STRIPE as string, {
    apiVersion: '2024-12-18.acacia',
});

export default stripe;