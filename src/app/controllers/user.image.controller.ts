import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as Users from "../models/user.model"
import * as imageModel from "../models/images.model";
import {getExtensionImage} from "../models/imageTools";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.statusMessage = "Id must be an integer"
            res.status(400).send();
            return;
        }
        const filename = await Users.getImageFilename(userId)
        if(filename == null) {
            res.status(404).send();
            return;
        }
        const [image, mimetype]  = await imageModel.readImage(filename)
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
    try{let isNew = true;
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.statusMessage = "Id must be an integer"
            res.status(400).send();
            return;
        }
        const image = req.body;
        const user = await Users.getUserById(userId);
        const token = req.get('X-Authorization');
        if(user[0].authToken !== token) {
            res.statusMessage = "Forbidden";
            res.status(403).send();
            return;
        }
        if(user == null) {
            res.status(404).send();
            return;
        }
        const mimeType = req.header('Content-Type');
        const fileExtension = getExtensionImage(mimeType);
        if (fileExtension === null) {
            res.statusMessage = 'Bad Request: photo must be image/jpeg, image/png, image/gif type, but it was: ' + mimeType;
            res.status(400).send();
            return;
        }

        if (image.length === undefined) {
            res.statusMessage = 'Bad request: empty image';
            res.status(400).send();
            return;
        }

        const savedFilename = await Users.getImageFilename(userId);
        if(savedFilename != null && savedFilename !== "") {
            await imageModel.removeImage(savedFilename);
            isNew = false;
        }
        const newFilename = await imageModel.addImage(image, fileExtension);
        await Users.setImageFileName(userId, newFilename);
        if(isNew)
            res.status(201).send()
        else
            res.status(200).send()

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
        // if (req.authId !== userId) {
        //     res.statusMessage = "Forbidden";
        //     res.status(403).send();
        //     return;
        // }
        if (user == null) {
            res.status(404).send();
            return;
        }
        const filename = await Users.getImageFilename(userId);
        if (filename == null || filename === "") {
            res.status(404).send();
            return;
        }
        await imageModel.removeImage(filename);
        await Users.removeImageFilename(userId)
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