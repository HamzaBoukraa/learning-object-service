import { UtilityUser } from '../shared/types/utility-users';

export abstract class UtilityDriverAbstract {
    abstract getUtilityUsers(): Promise<UtilityUser[]>;
}
