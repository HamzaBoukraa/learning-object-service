import { ReleaseEmailGateway } from './release-email-gateway';
import { LambdaGatewayStub } from './lambda-gateway-stub';
import { ServiceError, ServiceErrorReason } from '../../shared/errors';
import { LambdaGateway } from './lambda-gateway';

export class LambdaGatewayFactory {

    static instance: ReleaseEmailGateway;
    private constructor() {}

    static getLambdaGatewayInstance() {
        if (!this.instance) {
            switch (process.env.NODE_ENV) {
                case 'testing':
                    this.instance = new LambdaGatewayStub();
                    break;
                case 'development':
                    this.instance = new LambdaGatewayStub();
                    break;
                case 'production':
                    this.instance = new LambdaGateway();
                    break;
                default:
                    throw new ServiceError(ServiceErrorReason.INTERNAL);
            }
            return this.instance;
        } else {
            return this.instance;
        }
    }
}
