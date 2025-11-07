import jwt from 'jsonwebtoken';
import { Response } from 'express';

import prisma from '../../../db/prisma';
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY_DAYS, REFRESH_TOKEN_EXPIRY_DAYS_TXT } from '../../../models/constants/auth';

const generateAccessToken = (userId: string) => {
    return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET!, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });
};

const generateRefreshToken = (userId: string) => {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: REFRESH_TOKEN_EXPIRY_DAYS_TXT,
    });
};

const createTokens = async (userId: string) => {
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId,
            expiresAt: refreshTokenExpiry,
        },
    });

    return { accessToken, refreshToken };
}

const storeRefreshToken = (res: Response, refreshToken: string) => {
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth',
        maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    });
};

export {
    createTokens,
    storeRefreshToken
}
