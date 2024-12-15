import {signup, login, logout,updateAccount, deleteAccount, getProfile} from '../controllers/UserControllers';
import { Router } from "express";
import auth from '../middleware/auth';

const router = Router();

//public routes
router.post('/signup', signup);
router.post('/login', login);
//private routes
router.get('/logout', auth, logout);
router.get('/profile', auth, getProfile);
router.put('/update', auth, updateAccount);
router.delete('/delete', auth, deleteAccount);

export default router;