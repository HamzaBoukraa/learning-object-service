import { UserGateway } from '../../interfaces/UserGateway';
import { User } from '../../../shared/entity';
import { Stubs } from '../../../tests/stubs';

export class StubUserGateway implements UserGateway {
    stubs = new Stubs();
    getUser(username: string): Promise<User> {
        return Promise.resolve(this.stubs.user);
    }
}
