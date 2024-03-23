import {fs} from "mz";
import {generate} from "rand-token";
import Logger from "../../config/logger";

const filepath = './storage/images/';
const readImage = async (fileName: string) : Promise<[Buffer, string]> => {
    const image = await fs.readFile(filepath + fileName);
    const mimeType = getImageMimetype(fileName);
    return [image, mimeType];
}

const removeImage = async (filename: string): Promise<void> => {
    if(filename) {
        if (await fs.exists(filepath + filename)) {
            await fs.unlink(filepath + filename);
        }
    }
}

const addImage = async (image:any, fileExtension: string): Promise<string> => {
    const filename = generate(32) + fileExtension;

    try {
        await fs.writeFile(filepath + filename, image);
        return filename;
    } catch (err) {
        Logger.error(err);
        fs.unlink(filepath + filename).catch(err => Logger.error(err));
        throw err;
    }
}

const getImageMimetype = (filename: string): string => {
    if (filename.endsWith('.jpeg') || filename.endsWith('.jpg')) {
        return 'image/jpeg';
    }
    if (filename.endsWith('.gif')) {
        return 'image/gif';
    }
    if (filename.endsWith('.png')) {
        return 'image/png';
    }
    return 'application/octet-stream';
}

const getExtensionImage = (mimeType: string): string => {
    switch (mimeType) {
        case 'image/jpeg':
            return '.jpeg';
        case 'image/png':
            return '.png';
        case 'image/gif':
            return '.gif';
        default:
            return null;
    }
};

export {readImage, removeImage, addImage, getImageMimetype, getExtensionImage};
