import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Router } from 'express';

import prisma from '../../../db/prisma';
import { createTokens, storeRefreshToken } from './utils';
import { handlePrismaError } from '../../../db/prisma/utils/errorHandler';

const authRouter = Router();

authRouter.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Missing credentials' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: { name, email, password: hashedPassword },
            select: { id: true }
        });

        const { accessToken, refreshToken } = await createTokens(newUser.id);
        storeRefreshToken(res, refreshToken);

        res.status(201).json({ accessToken });
    } catch (error) {
        const { status, message } = handlePrismaError(error);
        res.status(status).json({ message });
    }
});

authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await prisma.user.findUnique({
            select: { id: true, password: true },
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isSamePassword = await bcrypt.compare(password, user.password);
        if (!isSamePassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const { accessToken, refreshToken } = await createTokens(user.id);
        storeRefreshToken(res, refreshToken);

        res.status(200).json({ accessToken });
    } catch (error: any) {
        const { status, message } = handlePrismaError(error);
        res.status(status).json({ message });
    }
});

authRouter.get('/refresh', async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    try {
        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
        } catch {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        const storedToken = await prisma.refreshToken.findUnique({ where: { token } });
        if (!storedToken || storedToken.expiresAt < new Date()) {
            return res.status(403).json({ message: 'Refresh token invalid or expired' });
        }

        const { accessToken, refreshToken: newRefreshToken } = await createTokens(decoded.userId);
        await prisma.refreshToken.delete({ where: { token } });

        storeRefreshToken(res, newRefreshToken);

        res.json({ accessToken });
    } catch (error: any) {
        const { status, message } = handlePrismaError(error);
        res.status(status).json({ message });
    }
});

authRouter.get('/logout', async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;

        if (token) {
            // delete many because it wont throw error
            await prisma.refreshToken.deleteMany({ where: { token } });
        }

        res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'strict' });

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: any) {
        const { status, message } = handlePrismaError(error);
        res.status(status).json({ message });
    }
});

export default authRouter;
