declare namespace NodeJS{
    interface ProcessEnv{
        SECRET_KEY: string;
        SECRET_STRIPE: string;
        STRIPE_WEBHOOK_SECRET: string
    }
}