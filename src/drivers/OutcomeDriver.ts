import { OUTCOME_SERVICE_ROUTES } from '../shared/routes';
import * as request from 'request-promise';
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
            const options = { ...this.options };
            options.uri = OUTCOME_SERVICE_ROUTES.DELETE_ALL(id, username);
            return request(options);
        } catch (e) {
            throw new ResourceError(`${e}`, ResourceErrorReason.BAD_REQUEST);
        }
    }
}