import {Request, Response} from "express";
import * as users from '../models/user.model';
import Logger from '../../config/logger';
import {validate} from "./validationController";
import * as schemas from '../resources/schemas.json';
import * as secret from '../services/passwords';

const register = async (req: Request, res: Response): Promise<void> => {
    Logger.http('Register a new user into the server: ${req.body.firstName }')
    const validation = await validate(schemas.user_register, req.body);
    if (validation !== true) {
        res.statusMessage = 'Bad Request. Invalid information';
        res.status(400).send();
        return;
    }
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const hashedPassword = await secret.hash(req.body.password);
    const user = await users.emailInUse(email);
    if (user.length !== 0) {
        res.statusMessage = 'Email already in use';
        res.status(403).send();
        return;
    }

    try{
        const result = await users.registerUser(email, firstName, lastName, hashedPassword)
        res.statusMessage = "Created";
        res.status(201).send({"userId": result.insertId});
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    Logger.http('Log in')

    const email = req.body.email;
    const password = req.body.password;
    const user = await users.emailInUse(email);
    if (!await users.checkPassword(email, password) || user.length === 0) {
        res.statusMessage = "UnAuthorized. Incorrect email/password";
        res.status(401).send();
        return;
    }

    try{
        const token = await users.createToken(email);
        const userId = user[0].userId;
        res.statusMessage = "Successfully gave a permission!";
        res.status(200).json({ token, userId });
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    Logger.http('Log out')
    const email = req.body.email;

    try{
        await users.deleteToken(email);
        res.statusMessage = "Logged out!!";
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
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

const update = async (req: Request, res: Response): Promise<void> => {
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

export {register, login, logout, view, update}