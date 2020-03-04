import { UtilityDriverAbstract } from '../../UtilityDriverAbstract';
import { UtilityUser } from '../../../shared/types/utility-users';

export class UtilityDriverStub implements UtilityDriverAbstract {
    async getUtilityUsers(): Promise<UtilityUser[]> {
      return [] as UtilityUser[];
    }
  }
