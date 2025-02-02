import { Request, Response, NextFunction } from "express";
import * as jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import moment from 'moment';
config();

// Extend the Request interface to include the user object
interface Authentation extends Request {
  user?: any;
}

const auth = (req: Authentation, res: Response, next: NextFunction) => {
  try {
    
    const token = req.cookies.token;
    //console.log('Received token:', token); // Debug log
    if (!token) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const payload = jwt.verify(token.replace(/['"]+/g, ''), process.env.SECRET_KEY) as jwt.JwtPayload;
    if (moment().unix() > payload.exp!) {
      res.status(401).json({ message: 'Token Expired' });
      return;
    }
    req.user = payload;
    next();
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: 'Internal Server Error' });
    return;
  }
}

export default auth;