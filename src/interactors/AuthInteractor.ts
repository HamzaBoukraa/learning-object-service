import { HashInterface, DataStore, Responder } from '../interfaces/interfaces';

import { UserID } from '../../schema/schema';

import { User } from 'clark-entity';

export class AuthInteractor {
    constructor() { }
    /**
            * Check if a user has provided the correct password.
            * NOTE: Promise is rejected if user does not exist.
            *
            * @param {string} userid the user's login id
            * @param {string} pwd the user's login password
            *
            * @returns {boolean} true iff userid/pwd pair is valid
            */
    async authenticate(dataStore: DataStore, responder: Responder, hash: HashInterface, username: string, pwd: string): Promise<void> {
        try {
            let id = await dataStore.findUser(username);
            let user = await dataStore.fetchUser(id);
            let authenticated = await hash.verify(pwd, user.pwdhash);
            responder.sendObject(authenticated);
        } catch (e) {
            responder.sendOperationError(e);
        }
    }

    /**
     * Add a new user to the database.
     * NOTE: this function only adds basic fields;
     *       the user.objects field is ignored
     * NOTE: promise rejected if another user with
     *       the same 'id' field already exists
     *
     * @async
     *
     * @param {User} user - entity to add
     *
     * @returns {UserID} the database id of the new record
     */
    async registerUser(dataStore: DataStore, responder: Responder, hash: HashInterface, _user: User): Promise<void> {
        try {
            let pwdhash = await hash.hash(_user.pwd);
            let user = await dataStore.insertUser({
                id: _user.id,
                name_: _user.name,
                email: _user.email,
                pwdhash: pwdhash,
                objects: [],
            });
            responder.sendObject(user);

        } catch (e) {
            responder.sendObject(e);
        }
    }

    /**
           * Check if a user has provided the correct password.
           * NOTE: Promise is rejected if user does not exist.
           *
           * @param {string} userid the user's login id
           * @param {string} pwd the user's login password
           *
           * @returns {boolean} true iff userid/pwd pair is valid
           */
    async emailRegisterd(dataStore: DataStore, responder: Responder, email: string): Promise<void> {
        try {
            let emailRegistered = await dataStore.emailRegistered(email);
            responder.sendObject(emailRegistered);
        } catch (e) {
            responder.sendOperationError(e);
        }
    }


}