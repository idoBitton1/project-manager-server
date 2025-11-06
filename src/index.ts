import 'dotenv/config';
import express, { json } from 'express';
import cookieParser from 'cookie-parser';

import apiRouter from './routes';
import requestLoggerMiddleware from './middlewares/loggerMiddleware';

const app = express();

app.use(json());
app.use(cookieParser());
app.use(requestLoggerMiddleware);

app.use('/api', apiRouter);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
