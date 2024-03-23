type Petition = {

    petitionId: number,
    title: string,
    description: string,
    creationDate: string,
    image: string,
    ownerId: number,
    categoryIds: number
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
type PetitionForView = {
    petitionId: number,
    title: string,
    categoryId:number,
    ownerId:number,
    ownerFirstName:string,
    ownerLastname:string,
    creationDate:string,
    supportingCost:number
}


type PetitionReturn = {
    petitions: PetitionForView[],
    count: number
}

type SupportTier = {
    supportTierId: number,
    petitionId: number,
    title: string,
    description: string,
    cost: number
}
type PetitionQuery = {
    q?: string,
    startIndex?: number,
    count?: number,
    categoryIds?: number[],
    supportingCost?: number,
    ownerId?: number,
    supporterId?: number,
    sortBy?: string
}