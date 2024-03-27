import {getPool} from "../../config/db";
import {ResultSetHeader} from "mysql2";

const getSupporter = async (petitionId: number ):Promise<SupportTier[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT ' +
        'Sup.id as supportId, ' +
        'Sup.support_tier_id as supportTierId, ' +
        'Sup.message as message, ' +
        'Sup.user_id as supporterId, ' +
        'User.first_name as supporterFirstName, ' +
        'User.last_name as supporterLastName, ' +
        'Sup.timestamp as timestamp ' +
        'FROM supporter Sup ' +
        'JOIN user User ON User.id = Sup.user_id ' +
        'WHERE petition_id = ? ' +
        'ORDER BY timestamp DESC';
    const [supporter] = await conn.query(query, [petitionId]);
    await conn.release();
    return supporter;
}
const checkSupporterWithAllIds = async (petitionId: number, supportTierId: number ):Promise<Supporter[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM supporter WHERE petition_id = ? AND support_tier_id = ?';
    const [supporter] = await conn.query(query, [petitionId, supportTierId]);
    await conn.release();
    return supporter;
}
const checkSupporterWithIds = async (petitionId: number, supportTierId: number, userId: number ):Promise<Supporter[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM supporter WHERE petition_id = ? AND support_tier_id = ? AND user_id = ?';
    const [supporter] = await conn.query(query, [petitionId, supportTierId, userId]);
    await conn.release();
    return supporter;
}
const addOneSupporter = async (petitionId: number, supportTierId: number, userId: number, message: string):Promise<ResultSetHeader> => {
    const conn = await getPool().getConnection();
    const query = 'INSERT INTO supporter (petition_id, support_tier_id, user_id, message, timestamp ) VALUES ( ? , ? , ? , ? , NOW())';
    const [result] = await conn.query(query, [petitionId, supportTierId, userId, message]);
    await conn.release();
    return result;
}



export { getSupporter, checkSupporterWithAllIds, checkSupporterWithIds, addOneSupporter }