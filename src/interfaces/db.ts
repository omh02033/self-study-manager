export interface DBUsers {
    id: number;
    uid: string;
    name: string;
    number: string;
    serial: string;
    classNum: string;
}
export interface DBStatus {
    uid: number;
    reason: string;
    fields: string;
    classNum: string;
}
export interface DBSub {
    reason: string;
    fields: string;
    classNum: string;
    number: string;
    serial: string;
    name: string;
}
export interface DBEtcManager {
    number: string;
    reason: string;
    manager: string;
    classNum: string;
    fields?: string;
    serial?: string;
}
export interface DBClassInfo {
    grade: string;
    class: string;
    totalNum: number;
}