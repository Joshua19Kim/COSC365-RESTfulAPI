import {getPool} from "../../config/db";

const showAll = async (petitionQuery: petitionQuery):Promise<any> => {
    let query = 'SELECT ' +
        'Pet.id as petId, ' +
        'Pet.title as petTitle, ' +
        'Pet.description as petDescription, ' +
        'Pet.creation_date as petCreationDate, ' +
        'Pet.image_filename as petImage, ' +
        'Pet.owner_id as petOwnerId, ' +
        'Pet.category_id as petCategoryIds, ' +
        'User.first_name as userFirstName, ' +
        'User.last_name as userLastName, ' +
        'SupTier.title as supTierTitle, ' +
        'SupTier.description as supTierDescription, ' +
        'SupTier.cost as supTierCost ' +
        'FROM petition Pet ' +
        'INNER JOIN user User ON Pet.owner_id = User.id ' +
        'INNER JOIN support_tier SupTier ON supTier.petition_id = Pet.id ';

    let countQuery = 'SELECT COUNT(Pet.id) AS totalCount ' +
        'FROM petition Pet ' +
        'INNER JOIN user User ON Pet.owner_id = User.id ' +
        'INNER JOIN support_tier SupTier ON SupTier.petition_id = Pet.id';



    const whereCondition: string[] = []
    const values: any[] = []
    if (petitionQuery.q && petitionQuery.q !== "") {
        whereCondition.push('(petTitle LIKE ? OR petDescription LIKE ?)');
        values.push(`%${petitionQuery.q}%`);
        values.push(`%${petitionQuery.q}%`);
    }
    if (petitionQuery.categoryIds && petitionQuery.categoryIds.length) {
        query += 'INNER JOIN category Cat ON Cat.id = Pet.category_id';
        countQuery += 'INNER JOIN category Cat ON Cat.id = Pet.category_id';
        whereCondition.push('category_id = ?');
        values.push(petitionQuery.categoryIds);
    }
    if (petitionQuery.supportingCost && petitionQuery.supportingCost !== -1) {
        whereCondition.push('category_id = ?');
        values.push(petitionQuery.categoryIds);
    }

    if (petitionQuery.supporterId && petitionQuery.supporterId !== -1) {
        query += 'INNER JOIN supporter Sup ON Sup.petition_id = Pet.id ';
        countQuery += 'INNER JOIN supporter Sup ON Sup.petition_id = Pet.id ';
    }

    if (whereCondition.length) {
        query += `\nWHERE ${(whereCondition ? whereCondition.join(' AND ') : 1)}\n`
        countQuery += `\nWHERE ${(whereCondition ? whereCondition.join(' AND ') : 1)}\n`
    }

    const countValue = [...values];
    const sortSwitch = (sort: string) => ({
        'ALPHABETICAL_ASC': 'ORDER BY petTitle ASC',
        'ALPHABETICAL_DESC': 'ORDER BY petTitle DESC',
        'COST_ASC': 'ORDER BY supTierCost ASC',
        'COST_DESC': 'ORDER BY supTierCost DESC',
        'CREATED_ASC': 'ORDER BY petCreationDate ASC',
        'CREATED_DESC': 'ORDER BY petCreationDate DESC',
    })[sort];
    query += sortSwitch(petitionQuery.sortBy) + ', petId\n';

    if (petitionQuery.count && petitionQuery.count !== -1) {
        query += 'LIMIT ?\n';
        values.push(petitionQuery.count);
    }
    if(petitionQuery.startIndex && petitionQuery.startIndex !== -1) {
        query += 'LIMIT ?\n';
        values.push(10000000000);
    }
    query += 'OFFSET ?\n';
    values.push(petitionQuery.startIndex);

    const countRows = await getPool().query(countQuery, countValue);
    return Object.values(JSON.parse(JSON.stringify(countRows[0][0])))[0];

}



const getCategories = async (): Promise<Category[]> => {
    const query = `SELECT id as categoryId, name as categoryName name FROM category`
    const rows = await getPool().query(query)
    return rows[0] as Category[];
}


export { showAll, getCategories}