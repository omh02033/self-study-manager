import request from "request-promise";
import '../config/env';
import { dimiLogin, dimiStudent, dimiTeacher, dimiGraduate } from "../interfaces";

function dimiApi({method, url, qs}: dimigo_api): Promise<any> {
    return new Promise((resolve, reject) => {
        request({method,
            url,
            headers: { Authorization: process.env.DIMI_AUTH },
            qs,
            json: true
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve(null);
        });
    });
}

export function login(uid:string, pwd:string): Promise<dimiLogin | null> {
    return dimiApi({
        method: 'GET',
        url: 'https://api.dimigo.hs.kr/v1/users/identify',
        qs: {
            username: uid,
            password: pwd
        }
    });
}

export function getStudent(uid:string): Promise<dimiStudent | null> {
    return dimiApi({
        method: 'GET',
        url: `https://api.dimigo.hs.kr/v1/user-students/${uid}`,
    });
}
export function getAllStudents(): Promise<dimiStudent[]> {
    return dimiApi({
      method: 'GET',
      url: 'https://api.dimigo.hs.kr/v1/user-students',
    });
  }

export function getTeacher(uid:string): Promise<dimiTeacher | null> {
    return dimiApi({
        method: 'GET',
        url: `https://api.dimigo.hs.kr/v1/user-teachers/${uid}`
    });
}
export function getAllTeachers(): Promise<dimiTeacher[]> {
    return dimiApi({
        method: 'GET',
        url: `https://api.dimigo.hs.kr/v1/user-teachers`
    });
}

export function getGraduate(uid: number): Promise<dimiGraduate | null> {
    return dimiApi({
      method: 'GET',
      url: `https://api.dimigo.hs.kr/v1/user-gcn-histories/${uid}`,
    });
}


interface dimigo_api {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    qs?: any
};