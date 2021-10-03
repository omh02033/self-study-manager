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
    const [user]: Array<DBUsers> = await knex('auth').where({ uuid });
    if(!user) {
        await knex('auth').insert({
            uuid,
            name,
            code: sid
        }).catch(err => {
            console.log(err);
            return res.status(500).json({result: false});
        });
        return res.status(200).json({result: true});
    } else {
        return res.status(400).json({ result: false, code: 'e' })
    }
})
.post('/outing', async (req: Request, res: Response) => {
    const { field, reason, uuid, classNum } = req.body;

    const [user]: Array<DBUsers> = await knex('auth').where({ uuid });

    const [status]: Array<DBStatus> = await knex('status').where({ uid: user.id });
    if(!status) {
        await knex('status').insert({
            uid: user.id,
            reason,
            fields: field,
            classNum
        }).catch(err => {
            console.log(err);
            return res.status(500).json({ result: false });
        });
        return res.status(200).json({ result: true, socketData: {
            classNum,
            serial: user.code,
            name: user.name,
            field,
            reason,
            status: 'o'
        } });
    } else {
        return res.status(400).json({ result: false, code: 'n' });
    }
})
.post('/update', async (req: Request, res: Response) => {
    const { field, reason, uuid, classNum } = req.body;

    const [user]: Array<DBUsers> = await knex('auth').where({ uuid });

    await knex('status').update({
        reason,
        fields: field
    }).where({ uid: user.id });

    return res.status(200).json({ result: true, socketData: {
        classNum,
        serial: user.code,
        name: user.name,
        field,
        reason,
        status: 'u'
    } });
})

.post('/comeback', async (req: Request, res: Response) => {
    const { uuid, classNum } = req.body;

    const [user]: Array<DBUsers> = await knex('auth').where({ uuid });
    const [status]: Array<DBStatus> = await knex('status').where({ uid: user.id });
    if(!status) {
        return res.status(400).json({ result: false, code: 'a' });
    } else {
        await knex('status').where({ uid: user.id }).del();
        return res.status(200).json({ result: true, socketData: {
            classNum,
            serial: user.code
        } });
    }
})

export default router;

interface DBUsers {
    id: number
    uuid: string
    name: string
    code: string
}
interface DBStatus {
    uid: number
    reason: string
    field: string
}