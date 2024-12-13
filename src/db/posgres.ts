import { Client } from "pg";

export const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'zack-y11',
    database: 'e-commerce'
})

export async function connect() {
    try {
        await client.connect();
        console.log('Connected to Postgres');
    }catch(e){
        console.error('Error connecting to Postgres');
    }
}


  
