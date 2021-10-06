// eslint ignore
type DimiUserType = 'T' | 'D' | 'S' | 'P' | 'O';

export interface dimiLogin {
    id: number;
    username: string;
    email: string;
    name: string;
    nick: string;
    gender: string;
    user_type: DimiUserType;
    birthdate: Date | null;
    phone: string;
    status: number;
    photofile1: string;
    photofile2: string | null;
    created_at: Date;
    updated_at: Date;
    password_hash: string | null;
    sso_token: string;
}

export interface dimiStudent {
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

export interface dimiTeacher {
    user_id: string;
    username: string;
    name: string;
    gender: string;
    position_name: string;
    role_name: string;
    grade: number;
    class: number;
}

export interface dimiGraduate {
    user_id: number;
    year1: number;
    class1: number;
    number1: number;
    year2: number;
    class2: number;
    number2: number;
    year3: number;
    class3: number;
    number3: number;
}