import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        'Missing Supabase credentials. Please check your .env file includes SUPABASE_URL and SUPABASE_KEY'
    );
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
