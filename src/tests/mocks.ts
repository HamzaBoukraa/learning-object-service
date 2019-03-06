import { LearningObject, User, LearningOutcome } from '../entity';
import { UserToken } from '../types';
import * as jwt from 'jsonwebtoken'
export const MOCK_OBJECTS = {
  TOTAL_RECORDS: 1,
  USERNAME: 'cypress',
  EMPTY_STRING: '',
  CURR_PAGE: 1,
  LIMIT: 3,
  NaN: NaN,
  LEARNING_OBJECT_NAME: 'testing',
  S3_LOCATION: 'http://s3.amazonaws.com/doc/2006-03-01/',
  S3_MULTIPART_UPLOAD_DATA: {
    uploadId: '123456789',
    completedPart: {
      ETag: 'tag',
      PartNumber: 101,
    },
  },
  LEARNING_OBJECT_ID: 'default_id',
  COLLECTION: {
    name: 'test',
    learningObjects: <any>[],
  },
  LEARNING_OBJECT: {
    author: 'author_bob',
    name: 'Input Validation - CS0 - JAVA',
    date: '1523479539862',
    length: 'nanomodule',
    levels: <any>[],
    goals: <any>[],
    outcomes: <any>[],
    materials:
    {
        files:<any>[],
        urls:[
        {
            title: "An Awesome File",
            url:"http://cis1.towson.edu/~cyber4all/modules/nanomodules/Buffer_Overflow-CS0_C++.html"
        },
        {
            title: "Another Awesome File",
            url:"https://youtu.be/MH_RD1jh0AE"
        },
        {
            title: "Yeet",
            url:"https://youtu.be/u47q-qX52JI"
        }
        ],
        notes:"",
        folderDescriptions:<any> [],
        pdf:
        {
            name:"0ReadMeFirst - Buffer Overflow - CS0 - C++.pdf",
            url:"https://neutrino-file-uploads.s3.us-east-2.amazonaws.com/skaza/5aa0013becba9a264dcd8030/0ReadMeFirst%20-%20Buffer%20Overflow%20-%20CS0%20-%20C%2B%2B.pdf"
        }
    },
    metrics: {},
    children: <any>[],
    contributors: <any>[],
    collection: 'nccp',
    id: 'default_id',
    status: LearningObject.Status.RELEASED,
  },
  LEARNING_OBJECT_CHILD :{
    authorID: '5b967621f7a3ce2f6cbf5ba1',
    name: 'Input Validation - CS0 - JAVA',
    date: '1523479539862',
    length: 'nanomodule',
    levels: <any>[],
    goals: <any>[],
    outcomes: <any>[],
    materials:
    {
        files:<any>[],
        urls:[
        {
            title: "An Awesome File",
            url:"http://cis1.towson.edu/~cyber4all/modules/nanomodules/Buffer_Overflow-CS0_C++.html"
        },
        {
            title: "Another Awesome File",
            url:"https://youtu.be/MH_RD1jh0AE"
        },
        {
            title: "Yeet",
            url:"https://youtu.be/u47q-qX52JI"
        }
        ],
        notes:"",
        folderDescriptions:<any>[],
        pdf:
        {
            name:"0ReadMeFirst - Buffer Overflow - CS0 - C++.pdf",
            url:"https://neutrino-file-uploads.s3.us-east-2.amazonaws.com/skaza/5aa0013becba9a264dcd8030/0ReadMeFirst%20-%20Buffer%20Overflow%20-%20CS0%20-%20C%2B%2B.pdf"
        }
    },
    metrics: {},
    children: <any>[],
    contributors: <any>[],
    collection: 'nccp',
    //id: 'default_id',
    status: 'released',
  },
  USERTOKEN: {
    username: 'Bob',
    name: 'uncle Bob',
    email: 'unitTest12@gmail.com',
    organization: 'Towson University',
    emailVerified: true,
    accessGroups: ['admin','reviewer@nccp'],
  },
  USER_MOCK:{ 
    _id: "author_bob",
    username: "Bob",
    name: "Uncle Bob",
    email: "unitTest12@gmail.com",
    organization: "Towson University",
    password: '$2b$10$Xo4wAJimokUp8Yha4c9boeiFufdf/UnxEuhbGHNuFrgqkHp.96P5a', //hash of 'password',
    objects:<any>[],
    emailVerified: true,
    bio: "random text random text random text random text random text random text random text random text random text random text",
    createdAt:"1534558693394"
},
DUPLICATE_USER_MOCK:{ 
  username: "unittest",
  name: "Uncle Bob",
  email: "unitTest13@gmail.com",
  organization: "Towson University",
  password: '$2b$10$Xo4wAJimokUp8Yha4c9obeiFufdf/UnxEuhbGHNuFrgqkHp.96P5a', //hash of 'password',
  objects:<any>[],
  emailVerified: true,
  bio: "text random text random text random text random text random text random text",
  createdAt:"1534556893394"
},
  CHANGELOG: {
    _id: '1234',
    learningObjectId: 'default_id',
    logs: [
      {
        userId: '123',
        date: new Date(),
        text: 'hello',
      },
    ],
  },
  LEARNING_OBJECT_STATS: {
    downloads: 1,
    saves: 1,
    total: 1,
    released: 1,
    lengths: {
      nanomodule: 1,
      micromodule: 1,
      module: 1,
      unit: 1,
      course: 1,
    },
    blooms_distribution: {
      apply: 1,
      evaluate: 1,
      remember: 1,
    },
  },
  blooms_distribution: {
    apply: 1,
    evaluate: 1,
    remember: 1,
  },

  COLLECTION_META: {
    name: 'test',
    abstracts: <any>[],
  },
  COLLECTION_NAME: 'test',
  MULTIPART_UPLOAD_STATUS: {
    _id: 'id',
    uploadId: 'upload id',
    partsUploaded: 2,
    totalParts: 2,
    fileSize: 134,
    path: 'path',
    bytesUploaded: 132,
    completedParts: <any>[],
    createdAt: 'time',
  },
  LEARNING_OBJECT_FILE: {
    id: '123456789',
    name: 'test',
    fileType: 'text',
    extension: 'txt',
    url: 'url',
    date: 'date',
    fullPath: 'path',
    size: 132,
    description: 'test',
    packageable: true,
  },
  METRICS: {
    saves: 23,
    downloads: 4,
  },
  USER: new User({ id: '123' }),
  OUTCOME: new LearningOutcome({ id: '123' }),
  USER_ID: '5a9583401405cb053272ced1',
  CHANGELOG_TEXT: 'Hello',
};

export const SUBMITTABLE_LEARNING_OBJECT = {
  ...MOCK_OBJECTS.LEARNING_OBJECT,
  //id: 'submittable_id',
  outcomes: ['notarealoutcomeid'],
  goals: [{ text: 'a description' }],
};

export const INVALID_LEARNING_OBJECTS = {
  NO_DESCRIPTION: {
    ...SUBMITTABLE_LEARNING_OBJECT,
    id: 'no_description_id',
    goals: [{ text: '' }],
  },
  NO_NAME: {
    ...SUBMITTABLE_LEARNING_OBJECT,
    id: 'no_name_id',
    name: '',
  },
};
export function generateToken(user: UserToken) {
  const payload = {
    username: user.username,
    name: user.name,
    email: user.email,
    organization: user.organization,
    emailVerified: user.emailVerified,
    accessGroups: user.accessGroups
  };
  const options = {
    issuer: 'THIS_IS_AN_ISSUER',
    expiresIn: 86400,
    audience: user.username
  };
  const token = jwt.sign(payload, 'THIS_IS_A_KEY', options);
  return token;
}
