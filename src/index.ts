import 'dotenv/config';
import express from 'express';

import apiRouter from './routes';

const app = express();

app.use(express.json());

app.use('/api', apiRouter);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
