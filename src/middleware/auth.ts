import { Request, Response, NextFunction } from "express";
import * as jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import moment from 'moment';
config();

//Extend the Request interface to include the user object
interface Authentation extends Request{
    user?: any
}

const auth = (req: Authentation, res: Response, next: NextFunction)=>{
    try{
        if(!req.cookies.token){
            res.status(401).json({message: 'Unauthorized'});
            return;
        }
        const token = req.cookies.token.replace(/['"]+/g, '')
        let payload = jwt.verify(token, process.env.SECRET_KEY) as jwt.JwtPayload;
        if(moment().unix() > payload.exp!){
            res.send({message: 'Token Expired'});
            return;
        }
        req.user = payload;
        next();
    }catch(e){
        console.log(e);
        res.status(500).json({message: 'Internal Server Error'});
        return;
    }
}

export default auth;