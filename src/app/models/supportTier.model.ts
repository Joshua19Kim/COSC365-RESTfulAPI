import {getPool} from "../../config/db";
import {ResultSetHeader} from "mysql2";


const checkSupportTierTitleExistence = async (supportTierTitle: string, petitionId: number):Promise<SupportTier[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM support_tier WHERE title = ? AND petition_id = ?';
    const [supportTier] = await conn.query(query, [ supportTierTitle, petitionId ]);
    await conn.release();
    return supportTier;
}

const checkSupportTier = async (petitionId: number ):Promise<SupportTier[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM support_tier WHERE petition_id = ?';
    const [supportTier] = await conn.query(query, [petitionId]);
    await conn.release();
    return supportTier;
}
const checkSupportTierWithIds = async (supportTierId: number, petitionId: number):Promise<SupportTier[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM support_tier WHERE id = ? AND petition_id = ?';
    const [supportTier] = await conn.query(query, [supportTierId, petitionId]);
    await conn.release();
    return supportTier;
}
const addOneSupportTier = async (title:string, description:string, cost:number, petitionId:number):Promise<ResultSetHeader> => {
    const conn = await getPool().getConnection();
    const query = 'INSERT INTO support_tier (title, description, cost, petition_id) VALUES ( ? , ? , ? , ? )';
    const [result] = await conn.query(query, [title, description, cost, petitionId]);
    await conn.release();
    return result;
}
const editSupportTier = async (title:string, description:string, cost:number, petitionId:number, supportTierId:number):Promise<void> => {
    const conn = await getPool().getConnection();
    const query = 'UPDATE support_tier SET title = ?, description = ?, cost = ? WHERE petition_id = ? AND id = ?';
    await conn.query(query, [title, description, cost, petitionId, supportTierId ]);
    await conn.release();
}
const checkSupporterWithId = async (supportTierId: number, petitionId: number ):Promise<SupportTier[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM supporter WHERE support_tier_id = ? AND petition_id = ?';
    const [supporter] = await conn.query(query, [ supportTierId, petitionId ]);
    await conn.release();
    return supporter;
}

export { addOneSupportTier, checkSupportTierTitleExistence, checkSupportTier, checkSupportTierWithIds, editSupportTier, checkSupporterWithId}