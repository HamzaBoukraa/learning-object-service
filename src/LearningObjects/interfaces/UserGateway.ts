import { User } from '../../shared/entity';

export abstract class UserGateway {
    /**
     * Retrieves a user object from a given username
     *
     * @abstract
     * @param {string} username [Username of the user to retrieve]
     * @returns {Promise<User>}
     * @memberof UserGateway
     */
    abstract getUser(username: string): Promise<User>;
}
