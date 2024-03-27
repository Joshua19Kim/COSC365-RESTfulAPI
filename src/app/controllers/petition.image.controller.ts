import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as Petition from "../models/petitions.model";
import * as imageModel from "../models/images.model";
import * as Users from "../models/user.model";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try{
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.statusMessage = "Id must be an integer"
            res.status(400).send();
            return;
        }
        const petition = (await Petition.getPetitionById(petitionId));
        if (petition.length === 0) {
            res.statusMessage = "Not Found. No petition with id."
            res.status(404).send();
            return;
        } else if (petition[0].filename === null) {
            res.statusMessage = "Not Found. Petition has no image."
            res.status(404).send();
            return;
        }
        const [image, mimetype]  = await imageModel.readImage(petition[0].filename)
        res.statusMessage = "OK"
        res.status(200).contentType(mimetype).send(image)
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
    try{
        let isNew = true;
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.statusMessage = "Id must be an integer"
            res.status(400).send();
            return;
        }
        const petition = (await Petition.getPetitionById(petitionId));
        if (petition.length === 0) {
            res.statusMessage = "Not Found. No petition found with Id"
            res.status(404).send();
            return;
        }
        const token = req.get('X-Authorization');
        if(petition[0].authToken !== token) {
            res.statusMessage = "Forbidden. Only the owner of a petition can change the hero image";
            res.status(403).send();
            return;
        }
        const mimeType = req.header('Content-Type');
        const fileExtension = imageModel.getExtensionImage(mimeType);
        if (fileExtension === null) {
            res.statusMessage = 'Bad Request: photo must be image/jpeg, image/png, image/gif type, but it was: ' + mimeType;
            res.status(400).send();
            return;
        }
        const image = req.body;
        if (image.length === undefined) {
            res.statusMessage = 'Bad request: empty image';
            res.status(400).send();
            return;
        }

        const savedFilename = petition[0].filename;
        if(savedFilename != null && savedFilename !== "") {
            await imageModel.removeImage(savedFilename);
            isNew = false;
        }
        const newFilename = await imageModel.addImage(image, fileExtension);
        await Petition.setImageFile(petitionId, newFilename);
        if(isNew) {
            res.statusMessage = 'Created. New image created'
            res.status(201).send()
        } else {
            res.statusMessage = 'OK. Image updated'
            res.status(200).send()
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


export {getImage, setImage};