import {Request, Response} from "express";
import * as users from '../models/user.model';
import Logger from '../../config/logger';
import * as valid from "./validationController";
import * as schemas from '../resources/schemas.json';
import * as secret from '../services/passwords';
import {getUserByToken} from "../models/user.model";
import {validate} from "./validationController";

const register = async (req: Request, res: Response): Promise<void> => {
    Logger.http('Register a new user into the server')
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
    try{
        const validation = await validate(schemas.user_login, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request. Invalid information`;
            res.status(400).send();
            return;
        }
        const email = req.body.email;
        const password = req.body.password;
        const user = await users.emailInUse(email);
        if (user.length === 0) {
            res.statusMessage = "UnAuthorized. Incorrect email";
            res.status(401).send();
            return;
        }
        if (!await users.checkPassword(email, password)) {
            res.statusMessage = "UnAuthorized. Incorrect password";
            res.status(401).send();
            return;
        }
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
    try{
        const token = req.get('X-Authorization');
        if (token === undefined) {
            res.statusMessage = "Unauthorized. Cannot log out if you are not authenticated."
            res.status(401).send();
        }
        const user = await users.getUserByToken(token);
        if (user.length === 0 || token !== user[0].authToken) {
            res.statusMessage = "UnAuthorized. Cannot log out if you are not authenticated.";
            res.status(401).send();
            return;
        }
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
    try{
        if ( isNaN(parseInt(req.params.id, 10))) {
            res.statusMessage = "ID must be an integer.";
            res.status(404).send();
            return;
        }
        const id = parseInt(req.params.id, 10);
        const user = await users.getUserById(id);
        if ( user.length ===0 ) {
            res.statusMessage = "Not Found. No user with specified ID";
            res.status(404).send();
            return;
        }
        const firstName = user[0].firstName;
        const lastName = user[0].lastName;
        const email = user[0].email;
        const token = req.get('X-Authorization');
        if(user[0].authToken === undefined || user[0].authToken !== token) {
            res.statusMessage = "OK, but unauthenticated request."
            res.status(200).json({firstName, lastName});
            return;
        }
        // const userToken = user[0].authToken
        res.statusMessage = "OK";
        res.status(200).json({email, firstName, lastName});
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
        const token = req.get('X-Authorization');
        if (id === undefined || token === undefined) {
            res.statusMessage = "Unauthorized or Invalid currentPassword";
            res.status(401).send();
            return;
        }
        if ( isNaN(id)) {
            res.statusMessage = "Not Found. No user with specified ID";
            res.status(404).send();
            return;
        }
        const user = await users.getUserById(id);
        if (user.length ===0) {
            res.statusMessage = "Not Found. No user with specified ID"
            res.status(404).send();
            return;
        }
        const validation = await valid.validate(schemas.user_edit, req.body);
        if (validation !== true) {
            res.statusMessage = 'Bad Request. Invalid information';
            res.status(400).send();
            return;
        }
        const userFromToken = await users.getUserByToken(token);
        if (userFromToken[0].id !== id) {
            res.statusMessage = "Forbidden. Cannot edit another user's information."
            res.status(403).send();
            return;
        }
        if (userFromToken[0].authToken === null || userFromToken[0].authToken !== user[0].authToken || user[0].authToken === null) {
            res.statusMessage = "Unauthorized or Invalid currentPassword";
            res.status(401).send();
            return;
        }
        if (req.body.hasOwnProperty('email')) {
            const checkEmail = await users.emailInUse(req.body.email);
            if ( checkEmail.length !== 0) {
                res.statusMessage = "Email is already in use."
                res.status(403).send();
                return;
            }
            user[0].email = req.body.email;
        }
        const currentPasswordExistence = req.body.hasOwnProperty('currentPassword');
        const passwordExistence = req.body.hasOwnProperty('password');
        if (!currentPasswordExistence) {
            res.statusMessage = "Invalid Information. need password"
            res.status(400).send();
            return;
        }
        const currentPassword = req.body.currentPassword;
        if (!secret.compare(currentPassword, user[0].password)) {
            res.statusMessage = "Invalid/Wrong currentPassword"
            res.status(401).send();
            return;
        }
        if (passwordExistence) {
            if (req.body.password === currentPassword) {
                res.statusMessage = "Identical current and new passwords"
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