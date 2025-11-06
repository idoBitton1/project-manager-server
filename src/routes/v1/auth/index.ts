import { Router } from 'express';

const authRouter = Router();

authRouter.post('/signup', (req, res) => {
    try {
        const {} = req.body;
    } catch (error) {
        console.log('error has occured while signup: ', error)
        res.sendStatus(400);
    }
})

export default authRouter;
