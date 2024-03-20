import { getPool } from "../../config/db";
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import { compare } from "../services/passwords";

const registerUser = async ( userEmail: string, firstName: string, lastName : string, password: string): Promise<ResultSetHeader> => {
    Logger.info(`Registering User ${firstName + lastName}`);
    const conn = await getPool().getConnection();
    const query = 'insert into user (email, first_name, last_name, password) values(?,?,?,?)';
    const [ result ] = await conn.query( query, [ userEmail, firstName, lastName, password]);
    await conn.release();
    return result;
};

const emailInUse = async ( userEmail: string ): Promise<User[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM user WHERE email = ?';
    const [ result ] = await conn.query( query, [userEmail]);
    await conn.release();
    return result;
}

const checkPassword = async (userEmail: string, password: string): Promise<boolean> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT password FROM user WHERE email = ?';
    const [ result ] = await conn.query( query, [userEmail]);
    const savedPassword = result[0].password;
    await conn.release();
    return !!await compare(password, savedPassword);
}

const createToken = async (userEmail: string): Promise<string> => {
    Logger.info(`Providing Authentication to ${userEmail}`);
    const conn = await getPool().getConnection();
    const token = uuidv4();
    const query = 'UPDATE user SET auth_token = ? WHERE email = ?';
    await conn.query (query, [token, userEmail]);
    await conn.release();
    return token;
}

const deleteToken = async (userEmail: string)=> {
    Logger.info(`Deleting Authentication to ${userEmail}`);
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET auth_token = ? WHERE email = ?';
    await conn.query (query, ['', userEmail]);
    return
}

export { registerUser, emailInUse, checkPassword, createToken, deleteToken }

