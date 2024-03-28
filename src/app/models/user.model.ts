import { getPool } from "../../config/db";
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import { compare } from "../services/passwords";

const registerUser = async ( userEmail: string, firstName: string, lastName : string, password: string): Promise<ResultSetHeader> => {
    const conn = await getPool().getConnection();
    const query = 'insert into user (email, first_name, last_name, password) values(?,?,?,?)';
    const [ result ] = await conn.query( query, [ userEmail, firstName, lastName, password]);
    await conn.release();
    return result;
};

const emailInUse = async ( userEmail: string ): Promise<User[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM user WHERE email = ?';
    const [ user ] = await conn.query( query, [userEmail]);
    await conn.release();
    return user;
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
    const conn = await getPool().getConnection();
    const token = uuidv4();
    const query = 'UPDATE user SET auth_token = ? WHERE email = ?';
    await conn.query (query, [token, userEmail]);
    await conn.release();
    return token;
}

const deleteToken = async (token: string)=> {
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET auth_token = NULL WHERE auth_token = ?';
    await conn.query(query, [token]);
    return
}
const getUserById = async (id: number): Promise<User[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT ' +
        'first_name as firstName, ' +
        'last_name as lastName, ' +
        'auth_token as authToken, ' +
        'email, ' +
        'image_filename as filename, ' +
        'password ' +
        'FROM user ' +
        'WHERE id = ?';
    const [ user ] = await conn.query( query, [id]);
    await conn.release();
    return user;
}

const getUserByToken = async (token: string): Promise<User[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT first_name as firstName, last_name as lastName, auth_token as authToken, email, id, password FROM user WHERE auth_token = ?';
    const [ result ] = await conn.query( query, [token]);
    await conn.release();
    return result;
}

const updateDetails = async (id: number, userEmail: string, firstName: string, lastName:string, password:string): Promise<void> => {
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET email = ?, first_name = ?, last_name = ?, password = ? WHERE id = ?';
    await conn.query(query, [userEmail, firstName, lastName, password, id]);
    await conn.release();
}

const setImageFile = async (id: number, filename: string): Promise<void> => {
    const query = `UPDATE user SET image_filename = ? WHERE id = ?`;
    await getPool().query(query, [filename, id]);
}

const removeImageFile = async (id: number): Promise<void> => {
    const query = `UPDATE user SET image_filename = NULL WHERE id = ?`;
    await getPool().query(query, [id]);
}



export { registerUser, emailInUse, checkPassword, createToken,
    deleteToken, getUserById, getUserByToken, updateDetails,
    setImageFile, removeImageFile }

