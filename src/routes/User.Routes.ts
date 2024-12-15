import {createUser, login, updateUser} from '../controllers/UserControllers';
import { Router } from "express";
import auth from '../middleware/auth';

const router = Router();

//public routes
router.post('/signup', createUser);
router.post('/login', login);
//private routes
router.get('/update', auth,updateUser);



export default router;