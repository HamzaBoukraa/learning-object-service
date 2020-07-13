import { OUTCOME_SERVICE_ROUTES } from '../shared/routes';
import * as request from 'superagent';
import { generateServiceToken } from './TokenManager';
import { ResourceError, ResourceErrorReason} from '../shared/errors';

export class OutcomeDriver {
    private options = {
        uri: '',
        json: true,
        headers: {
            Authorization: `Bearer ${generateServiceToken()}`,
        },
        method: 'DELETE',
        body: {},
    };

    public async deleteAllOutcomes(id: string, username: string): Promise<void> {
        try {
            const authorization = `Bearer ${generateServiceToken()}`;
            const response = await request
                .delete(OUTCOME_SERVICE_ROUTES.DELETE_ALL(id, username))
                .set('Accept', 'application/json')
                .set('Authorization', authorization);

            return response.body;
        } catch (e) {
            throw new ResourceError(`${e}`, ResourceErrorReason.BAD_REQUEST);
        }
    }
}