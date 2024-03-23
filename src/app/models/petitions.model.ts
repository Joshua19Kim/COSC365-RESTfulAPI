import {getPool} from "../../config/db";

const showAll = async (petitionQuery: PetitionQuery):Promise<PetitionReturn> => {
    let query = 'SELECT ' +
        'Pet.id as petitionId, ' +
        'Pet.title as title, ' +
        'Pet.category_id as categoryId, ' +
        'Pet.owner_id as ownerId, ' +
        'User.first_name as ownerFirstName, ' +
        'User.last_name as ownerLastName, ' +
        'Pet.creation_date as creationDate, ' +
        'supporter.id' +
        'MIN(SupTier.cost) as supportingCost ' +
        'FROM petition as Pet ' +
        'INNER JOIN user User ON Pet.owner_id = User.id ' +
        'INNER JOIN support_tier SupTier ON SupTier.petition_id = Pet.id ' +
        'INNER JOIN supporter ON Sup.petition_id = Pet.id ';

    let countQuery = 'SELECT COUNT(Pet.id) AS totalCount ' +
        'FROM petition Pet ' +
        'INNER JOIN user User ON Pet.owner_id = User.id ' +
        'INNER JOIN support_tier SupTier ON SupTier.petition_id = Pet.id ' +
        'INNER JOIN supporter Sup ON Sup.petition_id = Pet.id ';



    const whereCondition: string[] = []
    const values: any[] = []
    if (petitionQuery.q && petitionQuery.q !== "") {
        whereCondition.push('(Pet.title LIKE ? OR Pet.description LIKE ?) ');
        values.push(`%${petitionQuery.q}%`);
        values.push(`%${petitionQuery.q}%`);
    }
    if (petitionQuery.supporterId && petitionQuery.supporterId !== -1) {
        whereCondition.push('Sup.id = ? ');
        values.push(petitionQuery.supporterId);
    }
    if (petitionQuery.categoryIds && petitionQuery.categoryIds.length) {
        query += 'INNER JOIN category Cat ON Cat.id = Pet.category_id ';
        countQuery += 'INNER JOIN category Cat ON Cat.id = Pet.category_id ';
        whereCondition.push('category_id = ? ');
        values.push(petitionQuery.categoryIds);
    }
    if (petitionQuery.supportingCost && petitionQuery.supportingCost !== -1) {
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
        'COST_ASC': 'ORDER BY SupTier.cost ASC',
        'COST_DESC': 'ORDER BY SupTier.cost DESC',
        'CREATED_ASC': 'ORDER BY Pet.creation_date ASC',
        'CREATED_DESC': 'ORDER BY Pet.creation_date DESC',
    })[sort];
    query += sortSwitch(petitionQuery.sortBy) + ', petitionId\n';

    if (petitionQuery.count && petitionQuery.count !== -1) {
        query += ' LIMIT ?\n';
        values.push(petitionQuery.count);
    }
    if(petitionQuery.startIndex && petitionQuery.startIndex !== -1) {
        if (!petitionQuery.count || petitionQuery.count === -1) {
            query += ' LIMIT ?\n';
            values.push(10000000);
        }
        query += 'OFFSET ?\n';
        values.push(petitionQuery.startIndex);
    }
    // const conn = await getPool().getConnection();
    const rows = await getPool().query(query,values);
    const petitions = rows[0];
    const countRows = await getPool().query(countQuery, countValue);
    const count = countRows[0].length;
    return {petitions, count} as PetitionReturn;

}



const getCategories = async (): Promise<Category[]> => {
    const query = `SELECT id as categoryId, name as categoryName name FROM category`
    const rows = await getPool().query(query)
    return rows[0] as Category[];
}


export { showAll, getCategories }