import { HashInterface, DataStore, Responder, Interactor } from '../interfaces/interfaces';

import { UserID } from '@cyber4all/clark-schema';

import { User } from '@cyber4all/clark-entity';

export class AuthInteractor {

    constructor(private dataStore: DataStore, private hasher: HashInterface) { }
    /**
            * Check if a user has provided the correct password.
            * NOTE: Promise is rejected if user does not exist.
            *
            * @param {string} userid the user's login id
            * @param {string} pwd the user's login password
            *
            * @returns {boolean} true iff userid/pwd pair is valid
            */
    async authenticate(responder: Responder, username: string, pwd: string): Promise<void> {
        try {
            let id = await this.dataStore.findUser(username);
            let record = await this.dataStore.fetchUser(id);
            let user = new User(record.username ? record.username : record['id'], record.name_, record.email, null, null);
            let authenticated = await this.hasher.verify(pwd, record.pwdhash);
            authenticated ? responder.sendObject(User.serialize(user)) : responder.sendOperationErrorJSON({ error: "Authentication error. Username or password is invalid" });
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
    async registerUser(responder: Responder, _user: User): Promise<void> {
        try {
            let pwdhash = await this.hasher.hash(_user.pwd);

            let userID = await this.dataStore.insertUser({
                username: _user.username,
                name_: _user.name,
                email: _user.email,
                pwdhash: pwdhash,
                objects: [],
            });

            let user = new User(_user.username, _user.name, _user.email, null, null);

            responder.sendObject(User.serialize(user));

        } catch (e) {
            responder.sendOperationError(e);
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
    async emailRegisterd(responder: Responder, email: string): Promise<void> {
        try {
            let emailRegistered = await this.dataStore.emailRegistered(email);
            responder.sendObject(emailRegistered);
        } catch (e) {
            responder.sendOperationError(e);
        }
    }


}