

export const MOCK_OBJECTS = {
    USERNAME: 'cypress',
    USER_ID: '123456789',
    CHANGELOG_TEXT: 'lorem fdhjskafjhakfjh',
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
        published: true,
        children: <any>[],
        contributors: <any>[],
        lock: {},
        collection: 'nccp',
        id: 'default_id',
        publish: () => {
            this.published = true;
        },
        unpublish: () => {
            this.published = false;
        },
      },
    TOTAL_RECORDS: 1,
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
    USERTOKEN: {
        username: 'unittest',
        name: 'unit test',
        email: 'unit@test.com',
        organization: 'unittesting',
        emailVerified: 'true',
        accessGroups: ['']
    }, 
    CHANGELOG: {
        _id: '1234',
        learningObjectId: '1223',
        logs: [
            {
                userId: '123',
                date: new Date(),
                text: 'hello'
            }
        ]
    }
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
