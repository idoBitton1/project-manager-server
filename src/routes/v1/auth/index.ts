import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, Router } from 'express';

import prisma from '../../../db/prisma';
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from '../../../models/constants/auth';

const authRouter = Router();

const generateAccessToken = (userId: string) => {
    return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET!, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });
};

const generateRefreshToken = (userId: string) => {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: REFRESH_TOKEN_EXPIRY,
    });
};

authRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        const isSamePassword = await bcrypt.compare(password, user?.password ?? '');
        if (!user || !isSamePassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Store refresh token securely as HttpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/v1/auth/refresh',
        });

        res.status(200).json({ accessToken });
    } catch (error) {
        console.log('error while login: ', error);
        res.sendStatus(400);
    }
});

authRouter.get('/refresh', (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    jwt.verify(token, process.env.JWT_REFRESH_SECRET!, (err: any, decoded: any) => {
        if (err) return res.status(403).json({ message: 'Invalid refresh token' });
        const accessToken = generateAccessToken(decoded.userId);
        return res.json({ accessToken });
    });
});

export default authRouter;
