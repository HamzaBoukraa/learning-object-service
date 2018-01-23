import { HashInterface, DataStore, Responder, Interactor } from '../interfaces/interfaces';

import { UserID } from '@cyber4all/clark-schema';

import { User } from '@cyber4all/clark-entity';
export class UserInteractor implements Interactor {

    private _responder: Responder;

    public set responder(responder: Responder) {
        this._responder = responder;
    }

    constructor(private dataStore: DataStore, private hasher: HashInterface) { }


    async findUser(username: string): Promise<void> {
        try {
            let id = await this.dataStore.findUser(username);
            this.responder.sendObject(id);
        } catch (e) {
            this.responder.sendOperationError(e);
        }
    };

    /**
     * Load a user's scalar fields (ignore objects).
     * NOTE: this also ignores password
     * @async
     *
     * @param {string} userid the user's login id
     *
     * @returns {User}
     */
    async loadUser(id: UserID): Promise<void> {
        try {
            let record = await this.dataStore.fetchUser(id);

            let user = new User(record.username, record.name_, record.email, null);
            // not a deep operation - ignore objects

            this.responder.sendObject(user);
        } catch (e) {
            this.responder.sendOperationError(e);
        }
    };

    /**
     * Update an existing user record.
     * NOTE: this function only updates basic fields;
     *       the user.objects fields is ignored
     * NOTE: promise rejected if another user with
     *       the same 'id' field already exists
     *
     * @async
     *
     * @param {UserID} id - database id of the record to change
     * @param {User} user - entity with values to update to
     */
    async editUser(id: UserID, user: User): Promise<void> {

        try {
            let edit = {
                username: user.id,
                name_: user.name,
                email: user.email,
                pwdhash: '',
            };
            if (user.pwd) edit.pwdhash = await this.hasher.hash(user.pwd);
            else { delete edit.pwdhash; }
            /*
             * FIXME: The UserEdit argument to db.editUser requires a pwdhash,
             *       but unless user is explicitly changing password, user
             *       object won't have pwd set. The current solution tricks tsc
             *       into THINKING edit implements UserEdit, but then deletes
             *       pwdhash. The only reason this may be bad is that a more
             *       sophisticated future tsc version may notice the trick, and
             *       refuse to compile. The alternative is to look up the
             *       current pwdhash via a call to db.fetchUser. That's extra
             *       database strain, so we should only do that if tsc ever
             *       gets wise to our trick.
             */
            await this.dataStore.editUser(id, edit);
            this.responder.sendOperationSuccess();
        } catch (e) {
            this.responder.sendOperationError(e);
        }
    };
    async deleteUser(id: UserID): Promise<void> {
        try {
            await this.dataStore.deleteUser(id);
            this.responder.sendOperationSuccess();
        } catch (e) {
            this.responder.sendOperationError(e);
        }
    }
}