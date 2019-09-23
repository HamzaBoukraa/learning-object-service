import { UserGateway } from '../../interfaces/UserGateway';
import { Stubs } from '../../../tests/stubs';
import { User } from '../../../shared/entity';

export class MockUserGateway implements UserGateway {
    stubs = new Stubs();

    getUser(username: string): Promise<User> {
        return Promise.resolve(this.stubs.user);
    }
}
