import {
    LearningObject,
    User,
    Collection,
    Outcome,
    LearningOutcome,
} from '../src/shared/entity';

const LEARNING_OBJECT = new LearningObject({
    _id: IDS.PARENT.released_1,
    authorID: IDS.AUTHOR.Bob,
    date: '1520530093085',
    goals: [
        {
            text: 'Random text goal',
        },
        {
            text: 'Random text goal 2',
        },
    ],
    outcomes: [],
    published: true,
    name: 'Learn Unit Testing',
    length: LearningObject.Length.NANOMODULE,
    materials:
    {
        files: [],
        urls: [
            {
                title: 'An Awesome File',
                url: 'http://cis1.towson.edu/~cyber4all/modules/nanomodules/Buffer_Overflow-CS0_C++.html',
            },
            {
                title: 'Another Awesome File',
                url: 'https://youtu.be/MH_RD1jh0AE',
            },
            {
                title: 'Yeet',
                url: 'https://youtu.be/u47q-qX52JI',
            },
        ],
        notes: '',
        folderDescriptions: [],
        pdf:
            {
                name: '0ReadMeFirst - Buffer Overflow - CS0 - C++.pdf',
                url: 'https://neutrino-file-uploads.s3.us-east-2.amazonaws.com/skaza/5aa0013becba9a264dcd8030/0ReadMeFirst%20-%20Buffer%20Overflow%20-%20CS0%20-%20C%2B%2B.pdf',
            },
    },
    children: [IDS.CHILD.released_1, IDS.CHILD.waiting_1],
    levels: [LearningObject.Level.Undergraduate],
    contributors: [],
    collection: 'secinj',
    lock:
        {
            date: '1538061211867',
            restrictions: [],
        },
    status: LearningObject.Status.RELEASED,
});

const USER = new User({
    username: 'Bob',
    name: 'Uncle Bob',
    email: 'unitTest1@gmail.com',
    organization: 'Towson University',
    bio: 'random text random text random text random text random text random text random text random text random text random text',
    createdAt: '1534558693394',
    emailVerified: true,
});

const COLLECTION: Collection = {
    name: 'Security Injections',
    learningObjects: [],
};

const CHANGELOG_MOCK: Changelog = {
    _id: '5c3e2cab7da238008fcd771c',
    learningObjectId: 'default_id',
    logs: [
        {
            userId: '1234',
            date: '2019-01-15T18:55:39.000Z',
            text: 'hello',
        },
        {
            userId: '5678',
            date: '2019-01-15T18:55:39.000Z',
            text: 'hello two',
        },
    ],
};

const OUTCOME: Outcome = {
    author: 'NICE Workforce Framework Tasks',
    date: '2017',
    outcome: 'Employ secure configuration management processes.',
    name: 'T0084',
};

const LEARNING_OUTCOMEL: LearningOutcome = {
    _id: IDS.OUTCOME.EXPLAIN,
    source: '5af72b914803270dfc9aeae2',
    tag: 1,
    author: 'xinwen fu',
    name: 'IoT [09] - System Security',
    date: '1539726409073',
    outcome: 'Explain TrustZone hardware architecture',
    bloom: 'Remember and Understand',
    verb: 'Explain',
    text: 'TrustZone hardware architecture',
    assessments: [],
    strategies: [],
    mappings: ['5a674e2d04aa5f2a5ce97b0e'],
};




