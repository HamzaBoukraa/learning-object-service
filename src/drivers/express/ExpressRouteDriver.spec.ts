import {ExpressRouteDriver} from './ExpressRouteDriver';
import {MockLibraryDriver} from '../../tests/mock-drivers/MockLibraryDriver';
import {MockDataStore} from '../../tests/mock-drivers/MockDataStore';
import * as express from 'express';
import * as supertest from 'supertest';
import { LearningObject } from '../../entity';
const app = express();
const router = express.Router();
const tester = supertest(app);

describe('ExpressRouteDriver', ()=>{ 
    beforeAll(()=>{
        let driver = ExpressRouteDriver.buildRouter(MockDataStore,MockLibraryDriver, '')//T0D0 Figure out filemanager and implement mock
    })
    it("should return a status of 200 and a welcome message", done =>{
        tester.get(
            '/learning-objects'
        ).expect('content-type',/json/)
        .expect(200)
    })
    it("should return a status of 200 and a learning object for a specified user.", done=>{ 
        tester.get(
          '/learning-objects/:username/:learningObjectName'  
        )
        .expect('Content-Type',/json/)
        //TODO:MOCK USERTOKEN and pass
        //TODO:MOCK LEARNING OBJECT NAME ... 
        //TODO:MOCK REVISION BOOLEAN ...
        .expect(200)
        .then(res=>{
            expect(()=>{ 
                const obj = new LearningObject(res.body);
            }).not.toThrowError(); 
            done()
        })
    })
    it("should return a status of 200 and an array of objects for a User.", done=>{ 
        tester.get(
          '/users/:username/learning-objects/profile'  
        )
        .expect('Content-Type',/json/)
        //TODO: MOCK USERNAME TO PASS REQUEST
        //TODO: MOCK USERTOKEN/USER 
        .expect(200)
        //handle returned object array
    })
})
