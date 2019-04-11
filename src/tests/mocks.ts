import { LearningObject, User, LearningOutcome } from '../entity';

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
    author: '5a70fb5ed45bde3f9d65agfd',
    name: 'Input Validation - CS0 - C',
    date: '1523479539862',
    length: 'nanomodule',
    levels: <any>[],
    goals: <any>[],
    outcomes: <any>[],
    materials: {},
    metrics: {},
    children: <any>[],
    contributors: <any>[],
    collection: 'nccp',
    id: 'default_id',
    status: LearningObject.Status.RELEASED,
  },
  USERTOKEN: {
    username: 'unittest',
    name: 'unit test',
    email: 'unit@test.com',
    organization: 'unittesting',
    emailVerified: true,
    accessGroups: [''],
  },
  USERTOKEN_ALT: {
    username: 'unittestalt',
    name: 'unit test',
    email: 'unit@test.com',
    organization: 'unittesting',
    emailVerified: true,
    accessGroups: [''],
  },
  USERTOKEN_ADMIN: {
    username: 'unittest',
    name: 'unit test',
    email: 'unit@test.com',
    organization: 'unittesting',
    emailVerified: true,
    accessGroups: ['admin'],
  },
  USERTOKEN_EDITOR: {
    username: 'unittest',
    name: 'unit test',
    email: 'unit@test.com',
    organization: 'unittesting',
    emailVerified: true,
    accessGroups: ['editor'],
  },
  USERTOKEN_CURATOR_C5: {
    username: 'unittest',
    name: 'unit test',
    email: 'unit@test.com',
    organization: 'unittesting',
    emailVerified: true,
    accessGroups: ['curator@c5'],
  },
  USERTOKEN_REVIEWER_C5: {
    username: 'unittest',
    name: 'unit test',
    email: 'unit@test.com',
    organization: 'unittesting',
    emailVerified: true,
    accessGroups: ['reviewer@c5'],
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
  USER: new User({
    id: '123',
    username: 'unittestalt',
    name: 'unit test',
    email: 'unit@test.com',
    organization: 'unittesting',
    emailVerified: true,
  }),
  OUTCOME: new LearningOutcome({ id: '123' }),
  USER_ID: '5a70fb5ed45bde3f9d65agfd',
  CHANGELOG_TEXT: 'Hello',
};

export const SUBMITTABLE_LEARNING_OBJECT = {
  ...MOCK_OBJECTS.LEARNING_OBJECT,
  id: 'submittable_id',
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

export const SUBMISSION = {
  collection: 'c5',
  timestamp: 'date',
  learningObjectId: 'default_id',
};
