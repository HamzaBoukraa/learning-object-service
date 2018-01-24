import { HashInterface, DataStore, Responder, Interactor } from '../interfaces/interfaces';

import { UserID } from '@cyber4all/clark-schema';

import { User } from '@cyber4all/clark-entity';

export class AuthInteractor implements Interactor {

    private _responder: Responder;

    public set responder(responder: Responder) {
        this._responder = responder;
    }

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
    async authenticate(username: string, pwd: string): Promise<void> {
        try {
            let id = await this.dataStore.findUser(username);
            let record = await this.dataStore.fetchUser(id);
            let user = new User(record.username ? record.username : record['id'], record.name_, record.email, null);
            let authenticated = await this.hasher.verify(pwd, record.pwdhash);
            authenticated ? this._responder.sendObject(User.serialize(user)) : this._responder.sendOperationErrorJSON({ error: "Authentication error. Username or password is invalid" });
        } catch (e) {
            this._responder.sendOperationError(e);
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
    async registerUser(_user: User): Promise<void> {
        try {
            let pwdhash = await this.hasher.hash(_user.pwd);
            let userID = await this.dataStore.insertUser({
                username: _user.username,
                name_: _user.name,
                email: _user.email,
                pwdhash: pwdhash,
                objects: [],
            });
            let user = new User(_user.username, _user.name, _user.email, null);


            this._responder.sendObject(User.serialize(user));

        } catch (e) {
            this._responder.sendObject(e);
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
    async emailRegisterd(email: string): Promise<void> {
        try {
            let emailRegistered = await this.dataStore.emailRegistered(email);
            this._responder.sendObject(emailRegistered);
        } catch (e) {
            this._responder.sendOperationError(e);
        }
    }


}