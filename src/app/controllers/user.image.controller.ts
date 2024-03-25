import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as Users from "../models/user.model"
import * as imageModel from "../models/images.model";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.statusMessage = "Id must be an integer"
            res.status(400).send();
            return;
        }
        const user = (await Users.getUserById(userId));
        if (!user[0] || user[0].filename === null) {
            res.statusMessage = "Not Found. No user with specified ID, or user has no image."
            res.status(404).send();
            return;
        }
        const [image, mimetype]  = await imageModel.readImage(user[0].filename)
        res.status(200).contentType(mimetype).send(image)
    }
    catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
    try{
        let isNew = true;
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.statusMessage = "Id must be an integer"
            res.status(400).send();
            return;
        }
        const user = (await Users.getUserById(userId));
        if (!user[0]) {
            res.statusMessage = "Not Found. No such user with ID given"
            res.status(404).send();
            return;
        }
        const token = req.get('X-Authorization');
        if(user[0].authToken !== token) {
            res.statusMessage = "Forbidden. Can not change another user profile photo";
            res.status(403).send();
            return;
        }
        if(user == null) {
            res.status(404).send();
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

        const savedFilename = user[0].filename;
        if(savedFilename != null && savedFilename !== "") {
            await imageModel.removeImage(savedFilename);
            isNew = false;
        }
        const newFilename = await imageModel.addImage(image, fileExtension);
        await Users.setImageFile(userId, newFilename);
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

const deleteImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.statusMessage = "Id must be an integer"
            res.status(400).send();
            return;
        }
        const user = await Users.getUserById(userId);
        if (!user[0]) {
            res.statusMessage = 'Not Found. No such user with ID given'
            res.status(404).send();
            return;
        }
        const currentToken = req.get('X-Authorization');
        if (currentToken !== user[0].authToken) {
            res.statusMessage = 'Forbidden. Can not delete another user profile photo.'
            res.status(403).send();
        }
        if (user[0].authToken === null) {
            res.statusMessage = 'Unauthorized'
            res.status(401).send();
            return;
        }
        const savedFilename = user[0].filename;
        await imageModel.removeImage(savedFilename);
        await Users.removeImageFile(userId)
        res.statusMessage = 'OK'
        res.status(200).send();
    }
    catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getImage, setImage, deleteImage}