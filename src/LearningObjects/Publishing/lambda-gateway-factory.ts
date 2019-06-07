import { ReleaseEmailGateway } from './release-email-gateway';
import { LambdaGatewayStub } from './lambda-gateway-stub';
import { ServiceError, ServiceErrorReason } from '../../shared/errors';
import { LambdaGateway } from './lambda-gateway';

export class LambdaGatewayFactory {

    private _instance: ReleaseEmailGateway;

    /**
     * Creates an instance of ReleaseEmailGateway
     * Determines which ReleaseEmailGateway to use by looking
     * at NODE_ENV. This prevents developers from sening accidental
     * emails from development and allows for ease of testing.
     */
    constructor() {
        switch (process.env.NODE_ENV) {
            case 'testing':
                this._instance = new LambdaGatewayStub();
                break;
            case 'development':
                this._instance = new LambdaGatewayStub();
                break;
            case 'production':
                this._instance = new LambdaGateway();
                break;
            default:
                throw new ServiceError(ServiceErrorReason.INTERNAL);
        }
    }

    get instance(): ReleaseEmailGateway {
        return this._instance;
    }
}
