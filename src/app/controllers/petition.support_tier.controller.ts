import {Request, Response} from "express";
import Logger from "../../config/logger";
import {getUserByToken} from "../models/user.model";
import {validate} from "./validationController";
import * as schemas from '../resources/schemas.json';
import * as Petition from "../models/petitions.model";
import * as SupportTier from "../models/supportTier.model";


const addSupportTier = async (req: Request, res: Response): Promise<void> => {
    Logger.http("Add SupportTier")
    try{
        const token = req.get('X-Authorization');
        const user = await getUserByToken(token);
        if (user.length === 0) {
            res.statusMessage = `Unauthorized`;
            res.status(401).send();
            return;
        }
        const validation = await validate(schemas.support_tier_post, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request`;
            res.status(400).send();
            return;
        }
        if ( isNaN(parseInt(req.params.id, 10))) {
            res.statusMessage = "Bad Request. ID must be an integer.";
            res.status(400).send();
            return;
        }
        const petitionId = parseInt(req.params.id, 10);
        const petition = (await Petition.getPetitionById(petitionId));
        if (petition === undefined ){
            res.statusMessage = "Not Found. No petition found with id."
            res.status(404).send();
            return;
        }
        if (petition.authToken === null || petition.authToken !== token) {
            res.statusMessage = "Forbidden. Only the owner of a petition may modify it.";
            res.status(403).send();
            return;
        }
        const titleCheck = await SupportTier.checkSupportTierTitleExistence(req.body.title, petitionId);
        if (titleCheck.length !== 0) {
            res.statusMessage = "Bad request! SupportTier title must be unique within its petition."
            res.status(400).send();
            return;
        }
        const checkExistingNum = await SupportTier.checkSupportTier(petitionId);
        if (checkExistingNum.length >= 3) {
            res.statusMessage = "Forbidden. Can add a support tier if 3 already exist."
            res.status(403).send();
            return;
        }
        await SupportTier.addOneSupportTier(req.body.title, req.body.description, req.body.cost, petitionId);
        res.statusMessage = "OK Added SupporterTier!";
        res.status(201).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}
const editSupportTier = async (req: Request, res: Response): Promise<void> => {
    Logger.http("Edit SupportTier")
    try{
        const token = req.get('X-Authorization');
        const user = await getUserByToken(token);
        if (user.length === 0) {
            res.statusMessage = `Unauthorized`;
            res.status(401).send();
            return;
        }
        const validation = await validate(schemas.support_tier_patch, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request`;
            res.status(400).send();
            return;
        }
        const petitionId = parseInt(req.params.id, 10);
        const supportTierId = parseInt(req.params.tierId, 10);
        if ( isNaN(petitionId) || isNaN(supportTierId)) {
            res.statusMessage = "Bad Request. ID must be an integer.";
            res.status(400).send();
            return;
        }
        const petition = await Petition.getPetitionById(petitionId);
        const supportTier = (await SupportTier.checkSupportTierWithIds(supportTierId, petitionId));
        if (supportTier.length === 0 ){
            res.statusMessage = "Not Found. No support tier found with ids."
            res.status(404).send();
            return;
        }
        if (petition.authToken === null || petition.authToken !== token) {
            res.statusMessage = "Forbidden. Only the owner of a petition may modify it.";
            res.status(403).send();
            return;
        }
        const supporter = await SupportTier.checkSupporterWithId(supportTierId, petitionId);
        if (supporter.length !== 0) {
            res.statusMessage = "Forbidden. Can not edit a support tier if a supporter already exists for it."
            res.status(403).send();
            return;
        }
        let title = supportTier[0].title;
        if (req.body.hasOwnProperty("title")) {
            const checkTitle = await SupportTier.checkSupportTierTitleExistence(req.body.title, petitionId);
            if (checkTitle.length !== 0 && req.body.title !== supportTier[0].title) {
                res.statusMessage = "Forbidden. SupportTier title not unique within petition.";
                res.status(403).send();
                return;
            }
            title = req.body.title;
        }
        let description = supportTier[0].title;
        if (req.body.hasOwnProperty("description")) {
            description = req.body.description;
        }
        let cost = supportTier[0].cost;
        if (req.body.hasOwnProperty("cost")) {
            cost = req.body.cost;
        }
        await SupportTier.editSupportTier(title, description, cost, petitionId, supportTierId);
        res.statusMessage = "OK! Edited supportTier";
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deleteSupportTier = async (req: Request, res: Response): Promise<void> => {
    try{
        const token = req.get('X-Authorization');
        const user = await getUserByToken(token);
        if (user.length === 0) {
            res.statusMessage = `Unauthorized`;
            res.status(401).send();
            return;
        }
        const petitionId = parseInt(req.params.id, 10);
        const supportTierId = parseInt(req.params.tierId, 10);
        if ( isNaN(petitionId) || isNaN(supportTierId)) {
            res.statusMessage = "Bad Request. ID must be an integer.";
            res.status(400).send();
            return;
        }
        const petition = await Petition.getPetitionById(petitionId);
        const supportTier = (await SupportTier.checkSupportTierWithIds(supportTierId, petitionId));
        if (supportTier.length === 0 ){
            res.statusMessage = "Not Found. No support tier found with ids."
            res.status(404).send();
            return;
        }
        if (petition.authToken === null || petition.authToken !== token) {
            res.statusMessage = "Forbidden. Only the owner of a petition may delete it.";
            res.status(403).send();
            return;
        }
        const supporter = await SupportTier.checkSupporterWithId(supportTierId, petitionId);
        if (supporter.length !== 0) {
            res.statusMessage = "Forbidden. Can not delete a support tier if a supporter already exists for it"
            res.status(403).send();
            return;
        }
        const checkExistingNum = await SupportTier.checkSupportTier(petitionId);
        if (checkExistingNum.length === 1) {
            res.statusMessage = "Forbidden. Can not remove a support tier if it is the only one for a petition."
            res.status(403).send();
            return;
        }
        await SupportTier.deleteOneSupportTier(supportTierId, petitionId);
        res.statusMessage = "OK! Deleted!";
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}



export {addSupportTier, editSupportTier, deleteSupportTier};