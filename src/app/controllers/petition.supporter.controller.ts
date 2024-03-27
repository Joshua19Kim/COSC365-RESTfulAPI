import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as Petition from "../models/petitions.model";
import * as User from "../models/user.model";
import {validate} from "./validationController";
import * as schemas from "../resources/schemas.json";
import * as Supporter from "../models/supporter.model";
import * as SupportTier from "../models/supportTier.model";

const getAllSupportersForPetition = async (req: Request, res: Response): Promise<void> => {
    Logger.http("get All supporters for the petition")
    try{
        const petitionId = parseInt(req.params.id, 10);
        if ( isNaN(petitionId) ) {
            res.statusMessage = "Bad Request. ID must be an integer.";
            res.status(400).send();
            return;
        }
        const petition = await Petition.getPetitionById(petitionId);
        if (petition.length === 0 ){
            res.statusMessage = "Not Found. Not Found. No petition with id."
            res.status(404).send();
            return;
        }
        const supporterResult = await Supporter.getSupporter(petitionId);
        res.statusMessage = "OK!";
        res.status(200).send(supporterResult);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addSupporter = async (req: Request, res: Response): Promise<void> => {
    Logger.http("Add supporter")
    try{
        const token = req.get('X-Authorization');
        const user = await User.getUserByToken(token);
        if (user.length === 0) {
            res.statusMessage = `Unauthorized`;
            res.status(401).send();
            return;
        }
        const validation = await validate(schemas.support_post, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request`;
            res.status(400).send();
            return;
        }
        const petitionId = parseInt(req.params.id, 10);
        if ( isNaN(petitionId) ) {
            res.statusMessage = "Bad Request. ID must be an integer.";
            res.status(400).send();
            return;
        }
        const petition = await Petition.getPetitionById(petitionId);
        if (petition.length === 0 ){
            res.statusMessage = "Not Found. No petition found with ids."
            res.status(404).send();
            return;
        } else if (petition[0].ownerId === user[0].id) {
            res.statusMessage = "Forbidden. Cannot support your own petition"
            res.status(403).send();
            return;
        }
        const supportTier = await SupportTier.checkSupportTierWithIds( req.body.supportTierId, petitionId);
        if (supportTier.length === 0) {
            res.statusMessage = "Not Found. Support Tier does not exist."
            res.status(404).send();
            return;
        }
        const supporter = (await Supporter.checkSupporterWithIds(petitionId, req.body.supportTierId, user[0].id));
        if (supporter.length !== 0 ){
            res.statusMessage = "Forbidden. Already supported at this tier."
            res.status(403).send();
            return;
        }
        await Supporter.addOneSupporter(petitionId, req.body.supportTierId, user[0].id, req.body.message );
        res.statusMessage = "OK! Added new supporter";
        res.status(201).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getAllSupportersForPetition, addSupporter}