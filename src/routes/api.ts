import { Router, Request, Response } from 'express';
import knex from '../config/db';
import * as dimiApi from '../api/dimi';
import { DBUsers, DBStatus, DBSub, DBEtcManager } from '../interfaces';
import jwt from 'jsonwebtoken';

const router = Router();

router
.post('/isLogin', async (req: Request, res: Response) => {
    const token = req.cookies['token'];
    if(token) {
        jwt.verify(token, process.env.JWT_KEY as string, async (err: any, decoded: any) => {
            if(err) return res.status(400).json({ isLogin: false, delCookie: true });
            if(!decoded) return res.status(400).json({ isLogin: false, delCookie: true });
            const [user]: Array<DBUsers> = await knex('auth').where({ uid: decoded.uid });
            if(!user) return res.status(400).json({ isLogin: false, delCookie: true });
            return res.status(200).json({ isLogin: true, delCookie: false });
        });
    } else return res.status(400).json({ isLogin: false, delCookie: false });
})
.post('/login', async (req: Request, res: Response) => {
    const token = req.cookies['token'];
    if(token) { return res.redirect(`${process.env.URL}`); }
    else {
        const {uid, pwd} = req.body;
        const dimiUser = await dimiApi.login(uid, pwd);
        if(!dimiUser) return res.status(400).json({ msg: '아이디 또는 비밀번호가 일치하지 않습니다.' });
        const student = await dimiApi.getStudent(dimiUser.username);
        switch (dimiUser.user_type) {
            case 'S':
                if(student) {
                    const [user]: Array<DBUsers> = await knex('auth').where({ uid });
                    if(!user) {
                        await knex('auth').insert({
                            uid: student.username,
                            name: student.name,
                            number: student.number,
                            serial: student.serial,
                            classNum: `${student.grade}${student.class}`
                        })
                        .catch(err => { return res.status(500).json({ msg: '회원가입 하는 과정에서 에러가 발생하였습니다.', error: err }); });
                        const lToken = await jwt.sign({uid: student.username}, process.env.JWT_KEY as string);
                        return res.status(200).json({ token: lToken });
                    } else {
                        const lToken = await jwt.sign({uid: student.username}, process.env.JWT_KEY as string);
                        return res.status(200).json({ token: lToken });
                    }
                }
                break;
            default:
                return res.status(400).json({ msg: '학생 계정이 아닙니다.' });
        }
    }
})

.post('/outing', async (req: Request, res: Response) => {
    const token = req.cookies['token'];
    if(!token) return res.status(400).json({ result: false });

    const decoded: any = await jwt.verify(token, process.env.JWT_KEY as string);
    if(!decoded) return res.status(400).json({ msg: '토큰 에러' });

    const { field, reason } = req.body;

    const [user]: Array<DBUsers> = await knex('auth').where({ uid: decoded.uid });
    if(!user) return res.status(400).json({ msg: '회원가입 되지 않은 유저' });

    const [status]: Array<DBStatus> = await knex('status').where({ uid: user.id });
    if(!status) {
        await knex('status').insert({
            uid: user.id,
            reason,
            fields: field,
            classNum: user.classNum
        }).catch(err => {
            console.log(err);
            return res.status(500).json({ msg: '서버 에러' });
        });
    } else {
        await knex('status').update({
            reason,
            fields: field
        }).where({ uid: user.id });
    }
    return res.status(200).json({ socketData: {
        classNum: user.classNum,
        serial: user.serial,
        number: user.number,
        fields: field,
        reason
    } });
})

.post('/comeback', async (req: Request, res: Response) => {
    const token = req.cookies['token'];
    if(!token) return res.status(400).json({ result: false });

    const decoded: any = await jwt.verify(token, process.env.JWT_KEY as string);
    if(!decoded) return res.status(400).json({ msg: '토큰 에러' });

    const [user]: Array<DBUsers> = await knex('auth').where({ uid: decoded.uid });
    if(!user) return res.status(400).json({ msg: '회원가입 되지 않은 유저' });

    const [status]: Array<DBStatus> = await knex('status').where({ uid: user.id });
    if(!status) {
        const [etcManage]: Array<DBEtcManager> = await knex('etcmanager').where({ classNum: user.classNum, number: user.number });
        if(!etcManage) return res.status(400).json({ msg: '이미 복귀 처리 되었습니다.' });
        await knex('etcmanager').where({ classNum: user.classNum, number: user.number }).del();
        return res.status(200).json({ socketData: {
            classNum: user.classNum,
            serial: user.serial
        } });
    } else {
        await knex('status').where({ uid: user.id }).del();
        return res.status(200).json({ socketData: {
            classNum: user.classNum,
            serial: user.serial
        } });
    }
})

.post('/getClassNum', async (req: Request, res: Response) => {
    const token = req.cookies['token'];
    if(!token) return res.status(400).json({ result: false });

    const decoded: any = await jwt.verify(token, process.env.JWT_KEY as string);
    if(!decoded) return res.status(400).json({ msg: '토큰 에러' });

    const [user]: Array<DBUsers> = await knex('auth').where({ uid: decoded.uid });
    if(!user) return res.status(400).json({ msg: '회원가입 되지 않은 유저' });

    return res.status(200).json({ classNum: user.classNum });
})

.post('/prevOuting', async (req: Request, res: Response) => {
    const { classNum } = req.body;
    const users: Array<DBSub> = await knex('status').join('auth', 'auth.id', 'status.uid')
    .select('status.reason', 'status.fields', 'status.classNum', 'auth.number', 'auth.serial')
    .where({ 'status.classNum': classNum });
    const etcManage: Array<DBEtcManager> = await knex('etcmanager').where({ classNum });

    const students = await dimiApi.getAllStudents();

    let totalNum = 0;
    let etcNum = 0;
    for(let i of students) {
        if(i.serial)
            if(`${i.grade}${i.class}` == classNum) totalNum += 1;
    }

    for(let i of users) {
        if(i.fields === 'etc') etcNum += 1;
    }
    const etcMembers = [];
    for(let i of etcManage) {
        etcNum += 1;
        i.fields = 'etc';
        i.serial = i.number.length === 0 ? `${i.classNum}0${i.number}` : `${i.classNum}${i.number}`;
        etcMembers.push(i);
    }
    
    if(!users) return res.status(200).json({ users: [], etcNum, etcManage: etcMembers });
    else return res.status(200).json({ users, totalNum, etcNum, etcManage: etcMembers });
})

.post('/etcManage', async (req: Request, res: Response) => {
    const token = req.cookies['token'];
    if(!token) return res.status(400).json({ result: false });
    const decoded: any = jwt.verify(token, process.env.JWT_KEY as string);
    if(!decoded) return res.status(400).json({ msg: '토큰 에러' });

    const [user]: Array<DBUsers> = await knex('auth').where({ uid: decoded.uid });
    if(!user) return res.status(400).json({ msg: '회원가입 되지 않은 유저' });

    const { number, reason } = req.body;

    const [etcUser]: Array<DBUsers> = await knex('auth').where({ classNum: user.classNum, number });
    if(!etcUser) {
        const [etcMember]: Array<DBEtcManager> = await knex('etcmanager').where({ number, classNum: user.classNum });
        if(!etcMember) {
            await knex('etcmanager').insert({
                number,
                reason,
                manager: user.name,
                classNum: user.classNum
            })
            .catch(err => {
                return res.status(500).json({ msg: '서버 에러' });
            });
        } else {
            await knex('etcmanager').update({
                reason,
                manager: user.name,
            }).where({
                number,
                classNum: user.classNum
            });
        }
        const serial = number.length == 1 ? `${user.classNum}0${number}` : `${user.classNum}${number}`;
        return res.status(200).json({ socketData: {
            classNum: user.classNum,
            serial,
            number,
            fields: 'etc',
            reason
        } });
    } else {
        await knex('status').insert({
            uid: etcUser.id,
            reason,
            fields: 'etc',
            classNum: user.classNum
        }).catch(err => {
            console.log(err);
            return res.status(500).json({ msg: '서버 에러' });
        });
        return res.status(200).json({ socketData: {
            classNum: etcUser.classNum,
            serial: etcUser.serial,
            number,
            fields: 'etc',
            reason
        } });
    }
})
.post('/etcComeback', async (req: Request, res: Response) => {
    const token = req.cookies['token'];
    if(!token) return res.status(400).json({ result: false });

    const decoded: any = jwt.verify(token, process.env.JWT_KEY as string);
    if(!decoded) return res.status(400).json({ msg: '토큰 에러' });

    const [user]: Array<DBUsers> = await knex('auth').where({ uid: decoded.uid });
    if(!user) return res.status(400).json({ msg: '회원가입 되지 않은 유저' });

    const { number } = req.body;

    const status: Array<DBStatus[]> = await knex.raw("SELECT * FROM status WHERE uid=(SELECT id FROM auth WHERE `number`=? AND classNum=?)", [number, user.classNum]);
    const serial = number.length == 1 ? `${user.classNum}0${number}` : `${user.classNum}${number}`
    if(!status || status[0].length === 0) {
        const [etcManager]: Array<DBEtcManager> = await knex('etcmanager').where({ number, classNum: user.classNum });
        if(!etcManager) return res.status(400).json({ msg: '외출상태가 아닙니다.' });
        await knex('etcmanager').where({ number, classNum: user.classNum }).del();
        return res.status(200).json({ socketData: {
            classNum: user.classNum,
            serial
        } });
    }
    await knex.raw("DELETE FROM status WHERE uid=(SELECT id FROM auth WHERE `number`=? AND classNum=?)", [number, user.classNum]);
    return res.status(200).json({ socketData: {
        classNum: user.classNum,
        serial
    } });
})

export default router;