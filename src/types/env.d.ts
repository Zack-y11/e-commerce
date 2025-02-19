declare namespace NodeJS{
    interface ProcessEnv{
        SECRET_KEY: string;
        SECRET_STRIPE: string;
        STRIPE_WEBHOOK_SECRET: string
        SUPABASE_URL: string;
        SUPABASE_KEY: string;
        LOVABLE_URL: string;
        FRONTEND_URL: string;
    }
}