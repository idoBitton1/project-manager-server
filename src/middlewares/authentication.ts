import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// used for routes that require valid access token
const authenticateMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: number };
        (req as any).user = decoded;
        next();
    } catch {
        return res.status(403).json({ message: 'Token expired or invalid' });
    }
};

export default authenticateMiddleware;
