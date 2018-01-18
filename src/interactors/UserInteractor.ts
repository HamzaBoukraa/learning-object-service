import { HashInterface, DataStore, Responder } from '../interfaces/interfaces';

import { UserID } from '../../schema/schema';

import { User } from 'clark-entity';
export class UserInteractor {

    constructor() { }

    async findUser(dataStore: DataStore, responder: Responder, username: string): Promise<void> {
        try {
            let id = await dataStore.findUser(username);
            responder.sendObject(id);
        } catch (e) {
            responder.sendOperationError(e);
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
    async loadUser(dataStore: DataStore, responder: Responder, id: UserID): Promise<void> {
        try {
            let record = await dataStore.fetchUser(id);

            let user = new User(record.id, record.name_, record.email, null);
            // not a deep operation - ignore objects

            responder.sendObject(user);
        } catch (e) {
            responder.sendOperationError(e);
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
    async editUser(dataStore: DataStore, responder: Responder, hash: HashInterface, id: UserID, user: User): Promise<void> {

        try {
            let edit = {
                id: user.id,
                name_: user.name,
                email: user.email,
                pwdhash: '',
            };
            if (user.pwd) edit.pwdhash = await hash.hash(user.pwd);
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
            await dataStore.editUser(id, edit);
            responder.sendOperationSuccess();
        } catch (e) {
            responder.sendOperationError(e);
        }
    };
    async deleteUser(dataStore: DataStore, responder: Responder, id: UserID): Promise<void> {
        try {
            await dataStore.deleteUser(id);
            responder.sendOperationSuccess();
        } catch (e) {
            responder.sendOperationError(e);           
        }
    }
}