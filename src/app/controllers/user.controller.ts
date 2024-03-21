import {Request, Response} from "express";
import * as users from '../models/user.model';
import Logger from '../../config/logger';
import * as valid from "./validationController";
import * as schemas from '../resources/schemas.json';
import * as secret from '../services/passwords';
import {getUserByToken} from "../models/user.model";

const register = async (req: Request, res: Response): Promise<void> => {
    Logger.http('Register a new user into the server: ${req.body.firstName }')
    const validation = await valid.validate(schemas.user_register, req.body);
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
        const userId = user[0].id;
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
    const token = req.get('X-Authorization');
    try{
        await users.deleteToken(token);
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
    Logger.http('Show the user details');
    if ( isNaN(parseInt(req.params.id, 10))) {
        res.statusMessage = "Not Found. No user with specified ID";
        res.status(404).send();
        return;
    }
    const id = parseInt(req.params.id, 10);
    const idExists = await users.isThereId(id);
    if ( idExists === 0) {
        res.statusMessage = "Not Found. No user with specified ID";
        res.status(404).send();
        return;
    }
    const user = await users.getUserById(id);
    const firstName = user[0].firstName;
    const lastName = user[0].lastName;
    const email = user[0].email;
    const token = user[0].authToken
    if (token === null) {
        res.status(200).json({firstName, lastName});
        return;
    }
    try{
        res.statusMessage = "OK";
        res.status(200).json({firstName, lastName, email});
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const update = async (req: Request, res: Response): Promise<void> => {
    Logger.http('Updating details');
    try{
        const id= parseInt(req.params.id, 10);
        if ( isNaN(id)) {
            res.statusMessage = "Not Found. No user with specified ID";
            res.status(404).send();
            return;
        }
        const user = await users.getUserById(id);
        const validation = await valid.validate(schemas.user_edit, req.body);
        if (validation !== true) {
            res.statusMessage = 'Bad Request. Invalid information';
            res.status(400).send();
            return;
        }
        if (req.body.hasOwnProperty('email')) {
            const checkEmail = await users.emailInUse(req.body.email);
            if ( checkEmail.length === 0) {
                res.statusMessage = "Email is already in use."
                res.status(403).send();
                return;
            }
            user[0].email = req.body.email;
        }
        if (req.body.hasOwnProperty('password') && req.body.hasOwnProperty('currentPassword')) {
            if (req.body.password === req.body.currentPassword) {
                res.statusMessage = "Identical current and new passwords/"
                res.status(403).send();
                return;
            }
            user[0].password = await secret.hash(req.body.password);
        }
        if (req.body.hasOwnProperty('firstName')) {
            if(req.body.firstName.length === 0) {
                res.statusMessage = 'Bad Request. Invalid information';
                res.status(400).send();
                return;
            } else {
                user[0].firstName = req.body.firstName;
            }
        }
        if (req.body.hasOwnProperty('lastName')) {
            if(req.body.lastName.length === 0) {
                res.statusMessage = 'Bad Request. Invalid information';
                res.status(400).send();
                return;
            } else {
                user[0].lastName = req.body.lastName;
            }
        }
        const token = req.get('X-Authorization');
        if (user[0].authToken === null || user[0].authToken !== token) {
            res.statusMessage = "Unauthorized or Invalid currentPassword";
            res.status(401).send();
            return;
        }
        await users.updateDetails(id, user[0].email, user[0].firstName, user[0].lastName, user[0].password);
        res.statusMessage = "Successfully patched";
        res.status(200).send();
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {register, login, logout, view, update}