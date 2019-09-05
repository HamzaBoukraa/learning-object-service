import { User } from '../../../entity';
import { Stubs } from '../../../../tests/stubs';

export class MockUserServiceGateway {
    stubs = new Stubs();

    private constructor() { }

    static getInstance(): MockUserServiceGateway {
        return new MockUserServiceGateway();
    }

    getUser = async (username: string): Promise<User> => {
        return Promise.resolve(this.stubs.user);
    }

    queryUserById = async (id: string): Promise<User> => {
        return Promise.resolve(this.stubs.user);
    }

    findUser = async(username: string): Promise<string> => {
        return Promise.resolve(this.stubs.user.id);
    }

    findUserId = async(userIdentifier: string): Promise<string> => {
        return Promise.resolve(this.stubs.user.id);
    }
}
