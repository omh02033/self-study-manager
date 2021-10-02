import { Router, Request, Response } from 'express';
import knex from '../config/db';
import path from "path";

const router = Router();

router
.get('/get_uid', (req: Request, res: Response) => {
    return res.sendFile('get_uuid.html', { root: path.join(__dirname, '../public') });
})
.post('/register', async (req: Request, res: Response) => {
    const { sid, name, uuid } = req.body;
    await knex('auth').insert({ uuid, name, code: sid }).catch(err => {
        console.log(err);
        return res.status(500).json({result: false});
    });
    return res.status(200).json({result: true});
})

export default router;