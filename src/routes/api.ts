import { Router, Request, Response } from 'express';
import knex from '../config/db';
import request from 'request-promise';
import * as dimiApi from '../api/dimi';
import { DBUsers, DBStatus } from '../interfaces';
import jwt from 'jsonwebtoken';

const router = Router();

router
.post('/isLogin', async (req: Request, res: Response) => {
    const token = req.cookies['token'];
    if(token) {
        const decoded: any = jwt.verify(token, process.env.JWT_KEY as string);
        if(decoded) return res.status(400).json({ isLogin: false, delCookie: true });
        const [user]: Array<DBUsers> = await knex('auth').where({ uid: decoded.uid });
        if(!user) return res.status(400).json({ isLogin: false, delCookie: true });
        return res.status(200).json({ isLogin: true });
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
                        return res.status(200).json({ token: await jwt.sign({uid: student.username}, process.env.JWT_KEY as string) });
                    } else {
                        return res.status(200).json({ token: await jwt.sign({uid: user.uid}, process.env.JWT_KEY as string) });
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
    if(!token) return res.status(400).json({ msg: '로그인 만료' });

    const decoded: any = jwt.verify(token, process.env.JWT_KEY as string);
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
    if(!token) return res.status(400).json({ msg: '로그인 만료' });

    const decoded: any = jwt.verify(token, process.env.JWT_KEY as string);
    if(!decoded) return res.status(400).json({ msg: '토큰 에러' });

    const [user]: Array<DBUsers> = await knex('auth').where({ uid: decoded.uid });
    if(!user) return res.status(400).json({ msg: '회원가입 되지 않은 유저' });

    const [status]: Array<DBStatus> = await knex('status').where({ uid: user.id });
    if(!status) {
        return res.status(400).json({ msg: '이미 복귀 처리 되었습니다.' });
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
    if(!token) return res.status(400).json({ msg: '로그인 만료' });

    const decoded: any = jwt.verify(token, process.env.JWT_KEY as string);
    if(!decoded) return res.status(400).json({ msg: '토큰 에러' });

    const [user]: Array<DBUsers> = await knex('auth').where({ uid: decoded.uid });
    if(!user) return res.status(400).json({ msg: '회원가입 되지 않은 유저' });

    return res.status(200).json({ classNum: user.classNum });
})

.post('/prevOuting', async (req: Request, res: Response) => {
    const { classNum } = req.body;
    const users: Array<DBUsers> = await knex('status').join('auth', 'auth.id', 'status.uid')
    .select('status.reason', 'status.fields', 'status.classNum', 'auth.number', 'auth.serial')
    .where({ 'status.classNum': classNum });

    const students = await dimiApi.getAllStudents();
    let totalNum = 0;
    for(let i of students) {
        if(i.serial)
            if(`${i.grade}${i.class}` == classNum) totalNum += 1;
    }
    
    if(!users) return res.status(200).json({ users: [] });
    else return res.status(200).json({ users, totalNum });
})

export default router;