import { ReleaseEmailGateway } from './release-email-gateway';
import { LambdaGatewayStub } from './lambda-gateway-stub';
import { ServiceError, ServiceErrorReason } from '../../shared/errors';
import { LambdaGateway } from './lambda-gateway';

export class LambdaGatewayFactory {

    /**
     * Creates an instance of ReleaseEmailGateway
     * Determines which ReleaseEmailGateway to use by looking
     * at NODE_ENV. This prevents developers from sening accidental
     * emails from development and allows for ease of testing.
     */
    private constructor() {}

    static buildGateway(): ReleaseEmailGateway {
        switch (process.env.NODE_ENV) {
            case 'testing':
                return new LambdaGatewayStub();
            case 'development':
                return new LambdaGatewayStub();
            case 'production':
                return new LambdaGateway();
            default:
                throw new ServiceError(ServiceErrorReason.INTERNAL);
        }
    }
}
