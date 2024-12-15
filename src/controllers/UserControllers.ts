import { Request, Response } from "express";
import { client } from "../db/posgres";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const createUser = async (req: Request, res: Response)=>{
    try{
        if (!req.body) {
            res.status(400).json({ message: 'Bad Request: Missing request body' });
        }
        const { email, password, firstname, lastname, phone } = req.body;
        let hashpasword = await bcrypt.hash(password, 10);
        const response = await client.query('INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES ($1, $2, $3, $4, $5)', [email, hashpasword, firstname, lastname, phone]);
        res.status(201).json({
            message: 'User Created Successfully',
            body: {
            user: {email, password, firstname, lastname, phone}
            }
        });
    }catch(e){
        console.log(e);
        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
}
//loggin using email and password and jwt
export const login = async (req: Request, res: Response)=>{
    try{
        if(!req.body){
            res.status(400).json({message: 'Bad Request: Missing request body'});
            return;
        }
        const {email, password} = req.body;
        const response = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if(response.rows.length == 0){
            res.status(404).json({message: 'User not found'});
            return;
        }
        const user = response.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if(!validPassword){
            res.status(401).json({message: 'Invalid Password'});
            return;
        }
        //generate jwt
        const token = jwt.sign({email: user.email, id: user.id}, process.env.SECRET_KEY!, {expiresIn: '24h'});
        // Set the JWT in an HTTP-only cookie
        res.cookie('token', token, {httpOnly: true, secure: true, sameSite: 'strict'});
        res.status(200).json({message: 'Login Successful', token});   
    }catch(e){
        console.log(e);
        res.status(500).json({
            message: 'Internal Server Error'
        });
        return;
    }
}
//logout
export const logout = async (req: Request, res: Response)=>{
    res.clearCookie('token');
    res.status(200).json({message: 'Logout Successful'});
    return;
}
//update user
export const updateUser = async (req: Request, res: Response)=>{
    res.status(200).json({message: 'User Updated Successfully'});
    // try{
    //     if(!req.body){
    //         res.status(400).json({message: 'Bad Request: Missing request body'});
    //         return;
    //     }
    //     const {email, password, firstname, lastname, phone} = req.body;
    //     const response = await client.query('UPDATE users SET email = $1, password_hash = $2, first_name = $3, last_name = $4, phone = $5 WHERE id = $6', [email, password, firstname, lastname, phone, req.params.id]);
    //     res.status(200).json({message: 'User Updated Successfully'});
    // }catch(e){
    //     console.log(e);
    //     res.status(500).json({
    //         message: 'Internal Server Error'
    //     });
    //     return;
    // }
}
