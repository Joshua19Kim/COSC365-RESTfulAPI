import {Request, Response} from "express";
import Logger from '../../config/logger';
import {validate} from "./validationController";
import * as schemas from '../resources/schemas.json';
import * as Petition from '../models/petitions.model';
import {getUserByToken} from "../models/user.model";
import * as SupportTier from "../models/supportTier.model";



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
            const category = await Petition.getAllCategories()
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
            count: null,
            categoryIds: [],
            supportingCost: null,
            ownerId: null,
            supporterId: null,
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
    Logger.http('get the petition with ID number')
    try{
        const validation = await validate(schemas.petition_search, req.query);
        if (validation !== true) {
            res.statusMessage = `Bad Request`;
            res.status(400).send();
            return;
        }
        if ( isNaN(parseInt(req.params.id, 10))) {
            res.statusMessage = "ID must be an integer";
            res.status(404).send();
            return;
        }
        const id = parseInt(req.params.id, 10);
        const result = await Petition.getOnePetition(id);
        if (result === undefined) {
            res.statusMessage = "Not Found. No petition with ID";
            res.status(404).send();
            return;
        } else {
            res.statusMessage = "OK";
            res.status(200).send(result);
            return;
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const token = req.get('X-Authorization');
        const user = await getUserByToken(token);
        if (user.length === 0) {
            res.statusMessage = `Unauthorized`;
            res.status(401).send();
            return;
        }
        const validation = await validate(schemas.petition_post, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request`;
            res.status(400).send();
            return;
        }
        if (req.body.title === "") {
            res.statusMessage = "Bad request! Need title name!"
            res.status(400).send();
            return;
        }
        if (req.body.hasOwnProperty("title")) {
            const checkTitle = await Petition.checkTitleExistence(req.body.title);
             if (checkTitle.length !== 0) {
                res.statusMessage = "Forbidden. Petition title already exists"
                res.status(403).send();
                return;
            }
        }
        if (req.body.hasOwnProperty("categoryId")) {
            const checkCategoryId = await Petition.checkCategoryRef(req.body.categoryId);
            if (checkCategoryId.length === 0) {
                res.statusMessage = "Bad request! It must reference an existing category."
                res.status(400).send();
                return;
            }
        }
        const ownerId = user[0].id;
        const newPetition = await Petition.addPet(req.body.title, req.body.description, req.body.categoryId, ownerId);
        const petition = await Petition.findPetitionIdByTitle(req.body.title);
        const supportTiers = req.body.supportTiers;
        if (supportTiers.length <= 0 || supportTiers.length > 3) {
            res.statusMessage = "Bad request! A petition must have between 1 and 3 supportTiers(inclusive)."
            res.status(400).send();
            return;
        } else {
            // tslint:disable-next-line:prefer-for-of
            for(let i = 0; i < supportTiers.length; i++) {
                const titleCheck = await SupportTier.checkSupportTierTitleExistence(supportTiers[i].title, petition[0].petitionId )
                if (titleCheck.length !== 0) {
                    res.statusMessage = "Bad request! SupportTier title must be unique."
                    res.status(400).send();
                    return;
                }
            }
        }
        // tslint:disable-next-line:prefer-for-of
        for(let i = 0; i < supportTiers.length; i++) {
            const newSupportTier = await SupportTier.addOneSupportTier(supportTiers[i].title, supportTiers[i].description, supportTiers[i].cost, petition[0].petitionId);
        }
        res.statusMessage = "Created";
        res.status(201).send(petition[0]);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editPetition = async (req: Request, res: Response): Promise<void> => {
    Logger.http("Update petition!");
    try{
        const token = req.get('X-Authorization');
        const user = await getUserByToken(token);
        if (user.length === 0) {
            res.statusMessage = `Unauthorized`;
            res.status(401).send();
            return;
        }
        const validation = await validate(schemas.petition_patch, req.body);
        if (validation !== true) {
            res.statusMessage = 'Bad Request. Invalid information';
            res.status(400).send();
            return;
        }
        if ( isNaN(parseInt(req.params.id, 10))) {
            res.statusMessage = "ID must be an integer.";
            res.status(404).send();
            return;
        }
        const petitionId = parseInt(req.params.id, 10);
        const petition = (await Petition.getPetitionById(petitionId));
        if (petition.length === 0 ){
            res.statusMessage = "Not Found. No petition found with id."
            res.status(404).send();
            return;
        }
        if (petition[0].authToken === null || petition[0].authToken !== token) {
            res.statusMessage = "Only the owner of a petition may change it.";
            res.status(403).send();
            return;
        }
        let title = "";
        if (req.body.hasOwnProperty("title")) {
            title = req.body.title;
            const checkTitle = await Petition.checkTitleExistence(title);
            if (checkTitle.length !== 0) {
                res.statusMessage = "Forbidden. Petition title already exists"
                res.status(403).send();
            }
        }
        let description = "";
        if (req.body.hasOwnProperty("description")) {
            description = req.body.description;
        }
        let categoryId = null;
        if (req.body.hasOwnProperty("categoryId")) {
            categoryId = req.body.categoryId;
        }

        await Petition.updatePetition(title, description, categoryId, petitionId);

        res.statusMessage = "OK";
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deletePetition = async (req: Request, res: Response): Promise<void> => {
    Logger.http("Delete petition!");
    try{
        const token = req.get('X-Authorization');
        const user = await getUserByToken(token);
        if (user.length === 0) {
            res.statusMessage = `Unauthorized`;
            res.status(401).send();
            return;
        }
        const petitionId = parseInt(req.params.id, 10);
        if ( isNaN(petitionId) ) {
            res.statusMessage = "Bad Request. ID must be an integer.";
            res.status(400).send();
            return;
        }
        const petition = (await Petition.getPetitionById(petitionId));
        if (petition.length === 0 ){
            res.statusMessage = "Not Found. No petition found with id."
            res.status(404).send();
            return;
        }
        if (petition[0].authToken === null || petition[0].authToken !== token) {
            res.statusMessage = "Forbidden. Only the owner of a petition may change it.";
            res.status(403).send();
            return;
        }
        const supporter = await Petition.checkSupporter(petitionId);
        if (supporter.length !== 0) {
            res.statusMessage = "Forbidden. Can not delete a petition with one or more supporters.";
            res.status(403).send();
            return;
        }
        await Petition.deletePetition(petitionId);
        res.statusMessage = "OK Deleted";
        res.status(200).send();
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
        Logger.http("Show all categories!")
        const allCategories = await Petition.getAllCategories();
        res.statusMessage = "OK";
        res.status(200).send(allCategories);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getAllPetitions, getPetition, addPetition, editPetition, deletePetition, getCategories};