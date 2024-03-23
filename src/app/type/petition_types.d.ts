type Petition = {

    petId: number,
    petTitle: string,
    petDescription: string,
    petCreationDate: string,
    petImage: string,
    petOwnerId: number,
    petCategoryIds: number
}

type Category = {
    categoryId: number,
    categoryName: string
}

type Supporter = {
    supportId: number,
    petitionId: number,
    supportTierId: number,
    userId: number,
    message: string,
    timeStamp: string
}

type SupportTier = {
    supportTierId: number,
    petitionId: number,
    title: string,
    description: string,
    cost: number
}
type petitionQuery = {
    q?: string,
    startIndex?: number,
    count?: number,
    categoryIds?: Array<number>,
    supportingCost?: number,
    ownerId?: number,
    supporterId?: number,
    sortBy?: string
}