import {Request, Response} from "express";
import Logger from '../../config/logger';
import {validate} from "./validationController";
import * as schemas from '../resources/schemas.json';
import * as Petition from '../models/petitions.model';

const getAllPetitions = async (req: Request, res: Response): Promise<void> => {
    Logger.http("Request to show all petitions")
    try{
        const validation = await validate(schemas.petition_search, req.query);
        if (validation !== true) {
            res.statusMessage = `Bad Request`;
            res.status(400).send();
            return;
        }
        if (req.query.hasOwnProperty("startIndex")){
            req.query.startIndex = parseInt(req.query.startIndex as string, 10) as any;
        }
        if (req.query.hasOwnProperty("count")) {
            req.query.count = parseInt(req.query.count as string, 10) as any;
        }
        if (req.query.hasOwnProperty("categoryIds")) {
            if (!Array.isArray(req.query.categoryIds)) {
                req.query.categoryIds = [parseInt(req.query.categoryIds as string, 10)] as any;
            } else {
                req.query.categoryIds = (req.query.categoryIds as string[]).map((x: string) => parseInt(x, 10)) as any;
            }
            const category = await Petition.getCategories()
            if (!(req.query.categoryIds as any as number[]).every(c => category.map(x => x.categoryId).includes(c))) {
                res.statusMessage = "Bad Request";
                res.status(400).send();
                return;
            }
        }
        if (req.query.hasOwnProperty("supportingCost")) {
            req.query.supportingCost = parseInt(req.query.supportingCost as string, 10) as any;
        }
        if (req.query.hasOwnProperty("ownerId")) {
            req.query.ownerId = parseInt(req.query.ownerId as string, 10) as any;
        }
        if (req.query.hasOwnProperty("supporterId")) {
            req.query.supporterId = parseInt(req.query.supporterId as string, 10) as any;
        }
        let defaultSearch: PetitionQuery = {
            q: '',
            startIndex: 0,
            count: -1,
            categoryIds: [],
            supportingCost: -1,
            ownerId: -1,
            supporterId: -1,
            sortBy: 'CREATED_ASC'
        }
        defaultSearch = {...defaultSearch, ...req.query} as PetitionQuery;

        const result = await Petition.showAll(defaultSearch);
        res.statusMessage = "OK";
        res.status(200).send(result);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const getPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deletePetition = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getCategories = async(req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getAllPetitions, getPetition, addPetition, editPetition, deletePetition, getCategories};