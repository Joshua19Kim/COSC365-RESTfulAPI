import { getPool} from "../../config/db";
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';

const registerUser = async ( userEmail: string, firstName: string, lastName : string, password: string): Promise<ResultSetHeader> => {
    Logger.info(`Registering User ${firstName + lastName}`);
    const conn = await getPool().getConnection();
    const query = 'insert into user (email, first_name, last_name, password) values(?,?,?,?)';
    const [ result ] = await conn.query( query, [ userEmail, firstName, lastName, password ]);
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


export { registerUser, emailInUse }
