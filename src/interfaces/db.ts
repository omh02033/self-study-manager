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