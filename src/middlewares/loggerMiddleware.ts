import { performance } from 'perf_hooks';
import { Request, Response, NextFunction } from 'express';

interface LoggedRequest extends Request {
    startTime?: number; 
};

const requestLoggerMiddleware = (req: LoggedRequest, res: Response, next: NextFunction): void => {
    req.startTime = performance.now();

    res.on('finish', () => {
        const endTime = performance.now();
        const durationMs = endTime - (req.startTime ?? endTime);

        const clientIp = req.ip || 'Unknown IP';

        console.log(
            `[${new Date().toISOString()}] ` +
            `[${clientIp}] ` +
            `${req.method} ${req.originalUrl} - ` +
            `Status: ${res.statusCode} - ` +
            `Duration: ${durationMs.toFixed(3)} ms`
        );
    });

    next();
};

export default requestLoggerMiddleware;
