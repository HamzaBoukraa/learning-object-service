import {
    ExpressServiceModule,
    expressServiceModule,
} from 'node-service-module';

@expressServiceModule({
    expressRouter: ExpressHttpAdapter.buildRouter(),
    providers: [
        {

        },
    ],
})
export class FileAccessIdentites extends ExpressServiceModule {}
