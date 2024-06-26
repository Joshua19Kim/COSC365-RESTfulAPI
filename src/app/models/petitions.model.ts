import {getPool} from "../../config/db";
import {ResultSetHeader} from "mysql2";

const showAll = async (petitionQuery: PetitionQuery):Promise<PetitionReturn> => {
    let query = 'SELECT ' +
        'Pet.id as petitionId, ' +
        'Pet.title as title, ' +
        'Pet.category_id as categoryId, ' +
        'Pet.owner_id as ownerId, ' +
        'User.first_name as ownerFirstName, ' +
        'User.last_name as ownerLastName, ' +
        'Pet.creation_date as creationDate, ' +
        'MIN(SupTier.cost) as supportingCost ' +
        'FROM petition as Pet ' +
        'JOIN user User ON Pet.owner_id = User.id ' +
        'JOIN support_tier SupTier ON SupTier.petition_id = Pet.id ' +
        'JOIN supporter Sup ON Sup.petition_id = Pet.id ';

    let countQuery = 'SELECT COUNT(Pet.id) AS totalCount ' +
        'FROM petition Pet ' +
        'JOIN user User ON Pet.owner_id = User.id ' +
        'JOIN support_tier SupTier ON SupTier.petition_id = Pet.id ' +
        'JOIN supporter Sup ON Sup.petition_id = Pet.id ';



    const whereCondition: string[] = []
    const values: any[] = []
    if (petitionQuery.q && petitionQuery.q !== "") {
        whereCondition.push('(Pet.title LIKE ? OR Pet.description LIKE ?) ');
        values.push(`%${petitionQuery.q}%`);
        values.push(`%${petitionQuery.q}%`);
    }
    if (petitionQuery.supporterId) {
        whereCondition.push('Sup.user_id = ? ');
        values.push(petitionQuery.supporterId);
    }
    if (petitionQuery.ownerId) {
        whereCondition.push('Pet.owner_id = ? ');
        values.push(petitionQuery.ownerId);
    }
    if (petitionQuery.categoryIds && petitionQuery.categoryIds.length) {
        query += 'JOIN category Cat ON Cat.id = Pet.category_id ';
        countQuery += 'JOIN category Cat ON Cat.id = Pet.category_id ';
        whereCondition.push('category_id IN (' + petitionQuery.categoryIds.map(() =>'?').join(', ') + ')');
        values.push(...petitionQuery.categoryIds);
    }
    if (petitionQuery.supportingCost === 0) {
        whereCondition.push(('SupTier.cost = 0'))
    } else if (petitionQuery.supportingCost > 0) {
        whereCondition.push('SupTier.cost <= ? ');
        values.push(petitionQuery.supportingCost);
    }

    if (whereCondition.length) {
        query += `WHERE ${(whereCondition ? whereCondition.join(' AND ') : 1)} `
        countQuery += `WHERE ${(whereCondition ? whereCondition.join(' AND ') : 1)} `
    }

    query += 'GROUP BY Pet.id, Pet.owner_id ';
    countQuery += 'GROUP BY Pet.id, Pet.owner_id ';
    const countValue = [...values];
    const sortSwitch = (sort: string) => ({
        'ALPHABETICAL_ASC': 'ORDER BY Pet.title ASC',
        'ALPHABETICAL_DESC': 'ORDER BY Pet.title DESC',
        'COST_ASC': 'ORDER BY supportingCost ASC',
        'COST_DESC': 'ORDER BY supportingCost DESC',
        'CREATED_ASC': 'ORDER BY Pet.creation_date ASC',
        'CREATED_DESC': 'ORDER BY Pet.creation_date DESC',
    })[sort];
    query += sortSwitch(petitionQuery.sortBy) + ', petitionId\n';
    query += ' LIMIT ?\n';
    values.push(petitionQuery.count ? petitionQuery.count : 10000000);
    query += 'OFFSET ?\n';
    values.push(petitionQuery.startIndex);
    // const conn = await getPool().getConnection();
    const rows = await getPool().query(query,values);
    const petitions = rows[0];
    const countRows = await getPool().query(countQuery, countValue);
    const count = countRows[0].length;
    return {petitions, count} as PetitionReturn;

}
const getOnePetition = async (petitionId: number):Promise<OnePetitionReturn> => {
    const petitionQuery = 'SELECT ' +
        'Pet.id as petitionId, ' +
        'Pet.title as title, ' +
        'Pet.category_id as categoryId, ' +
        'Pet.owner_id as ownerId, ' +
        'User.first_name as ownerFirstName, ' +
        'User.last_name as ownerLastName, ' +
        '(SELECT COUNT(Sup.id) FROM supporter Sup JOIN petition Pet ON Sup.petition_id = Pet.id WHERE Pet.id = ?) as numberOfSupporters, ' +
        'Pet.creation_date as creationDate, ' +
        'Pet.description as description, '+
        '(SELECT SUM(SupTier.cost) FROM support_tier SupTier JOIN supporter Sup ON SupTier.petition_id = Sup.petition_id AND SupTier.id = Sup.support_tier_id WHERE Sup.petition_id = ?) as moneyRaised ' +
        'FROM petition as Pet ' +
        'JOIN user User ON Pet.owner_id = User.id ' +
        'WHERE Pet.id = ?';
    const supportTiersQuery = 'SELECT ' +
        'SupTier.id as supportTierId, SupTier.title as title, SupTier.description as description, SupTier.cost as cost  ' +
        'FROM support_tier SupTier ' +
        'JOIN petition Pet ON SupTier.petition_id = Pet.id WHERE Pet.id = ?';

    const petitionRows = await getPool().query(petitionQuery, [petitionId, petitionId, petitionId]);
    if (petitionRows[0].length ===0) {
        return undefined;
    }
    const supportTiersQueryRows = await getPool().query(supportTiersQuery, petitionId);

    const onePetition: OnePetitionReturn = {
        petitionId: petitionRows[0][0].petitionId,
        title: petitionRows[0][0].title,
        categoryId: petitionRows[0][0].categoryId,
        ownerId: petitionRows[0][0].ownerId,
        ownerFirstName: petitionRows[0][0].ownerFirstName,
        ownerLastName: petitionRows[0][0].ownerLastName,
        numberOfSupporters: petitionRows[0][0].numberOfSupporters,
        creationDate: petitionRows[0][0].creationDate,
        description: petitionRows[0][0].description,
        moneyRaised: parseInt(petitionRows[0][0].moneyRaised,10),
        supportTiers: supportTiersQueryRows[0],
    };
    return onePetition;
}

const getPetitionById = async (id: number): Promise<PetitionWithAuth[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT ' +
        'Pet.title as title, ' +
        'Pet.description as description, ' +
        'Pet.id as petitionId, ' +
        'User.auth_token as authToken, ' +
        'Pet.owner_id as ownerId, ' +
        'Pet.image_filename as filename ' +
        'FROM petition Pet ' +
        'JOIN  user User on Pet.owner_id = User.id WHERE Pet.id = ?';
    const [ petition ] = await conn.query( query, [id]);
    await conn.release();
    return petition;
}

const getAllCategories = async (): Promise<Category[]> => {
    const query = `SELECT id as categoryId, name as categoryName FROM category`
    const rows = await getPool().query(query)
    return rows[0] as Category[];
}
const checkCategoryRef  = async (categoryId: string):Promise<Category[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM category WHERE id = ?';
    const [category] = await conn.query(query, [categoryId]);
    await conn.release();
    return category;
}
const addPet = async (title:string, description:string, categoryId:number, ownerId:number):Promise<ResultSetHeader> => {
    const conn = await getPool().getConnection();
    const query = 'INSERT INTO petition (title, description, category_id, creation_date, owner_id) VALUES ( ? , ? , ?, NOW(), ? )';
    const [result] = await conn.query(query, [ title, description, categoryId, ownerId ]);
    await conn.release();
    return result;
}
const findPetitionIdByTitle = async (title:string):Promise<Petition[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT id as petitionId FROM petition WHERE title = ?';
    const [petition] = await conn.query(query, [ title ]);
    await conn.release();
    return petition;
}
const checkSupporter = async (petitionId: number):Promise<Supporter[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM supporter WHERE petition_id = ?';
    const [supporter] = await conn.query(query, [petitionId]);
    await conn.release();
    return supporter;
}
const deletePetition = async (petitionId: number ): Promise<void> => {
    const conn = await getPool().getConnection();
    const query = 'DELETE FROM petition WHERE id = ? ';
    await conn.query(query, [petitionId]);
    await conn.release();
}
const updatePetition = async (title: string, description: string, categoryId: number, petitionId: number): Promise<void> => {
    let query = 'UPDATE petition '

    const setCondition: string[] = []
    const values: any[] = []
    if (title !== "") {
        setCondition.push('petition.title = ? ')
        values.push(title)
    }
    if (description !== "") {
        setCondition.push('petition.description = ? ')
        values.push(description)
    }
    if (categoryId !== null) {
        setCondition.push('petition.category_id = ? ')
        values.push(categoryId)
    }
    if (setCondition.length) {
        query += ` SET ${(setCondition ? setCondition.join(', ') : 1)} `
    }
    query += 'WHERE petition.id = ? ';
    values.push(petitionId);
    const conn = await getPool().getConnection();
    await conn.query(query, values );
    await conn.release();
    return;
}
const checkTitleExistence = async (title: string):Promise<Petition[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM petition WHERE title = ?';
    const [ petition ] = await conn.query( query, [title]);
    await conn.release();
    return petition;
}
const setImageFile = async (petitionid: number, filename: string): Promise<void> => {
    const query = `UPDATE petition SET image_filename = ? WHERE id = ?`;
    await getPool().query(query, [filename, petitionid]);
}


export { showAll, getOnePetition, getPetitionById, getAllCategories, checkCategoryRef, findPetitionIdByTitle, updatePetition
    , addPet, checkSupporter, checkTitleExistence, deletePetition, setImageFile }