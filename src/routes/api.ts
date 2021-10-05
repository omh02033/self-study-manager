import { Router, Request, Response } from 'express';
import knex from '../config/db';
import request from 'request-promise';

const router = Router();

router
.post('/getStudents', async (req: Request, res: Response) => {
    const students = await getStudents();
    const sixClass = [];
    for(let i of students) {
        if(i.grade === 1 && i.class === 6) {
            sixClass.push(i);
        }
    }
    return res.status(200).json({ students: sixClass });
})
.post('/outing', async (req: Request, res: Response) => {
    const { classNum } = req.body;
    const users: Array<DBUsers> = await knex('status').join('auth', 'auth.id', 'status.uid')
    .select('status.reason', 'status.fields', 'status.classNum', 'auth.number', 'auth.code')
    .where({ classNum });
    
    for(let i=0; i<users.length; i++) {
        users[i].serial = users[i].code;
        delete users[i].code;
        users[i].classNum = classNum;
    }

    const students = await getStudents();
    let totalNum = 0;
    for(let i of students) {
        if(i.serial)
            if(i.serial.substr(0,2) == classNum) totalNum += 1;
    }

    if(!users) return res.status(200).json({ users: [] });
    else return res.status(200).json({users, totalNum});
    // SELECT s.reason, s.fields, s.classNum, a.name, a.code FROM status AS s JOIN `auth` AS a ON s.uid = a.id WHERE classNum=?;
})

export default router;

function getStudents(): Promise<DimiStudent[]> {
    return new Promise((resolve, reject) => {
        request({
            method: 'GET',
            url: 'https://api.dimigo.hs.kr/v1/user-students',
            headers: {
                Authorization: 'bGlmZTpkaW1pZ28xMiNAbGlmZWRi'
            }
        })
        .then(data => {
            resolve(JSON.parse(data));
        });
    });
}

interface DimiStudent {
    user_id: number;
    username: string;
    name: string;
    gender: string;
    phone: string;
    grade: number;
    class: number;
    number: number;
    serial: string;
    rfcard_uid: string;
    photofile1: string;
    photofile2: string | null;
    dormitory: string;
    library_id: string;
  }

interface DBUsers {
    id: number;
    uuid: string;
    number: string;
    code?: string;
    serial?: string;
    classNum?: string;
}
interface DBStatus {
    uid: number;
    reason: string;
    field: string;
}