

export const MOCK_OBJECTS = {
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
        learningObjects: [],
    },
    LEARNING_OBJECT: {
        author: '5a70fb5ed45bde3f9d65agfd',
        name: 'Input Validation - CS0 - C',
        date: '1523479539862',
        length: 'nanomodule',
        levels: [],
        goals: [],
        outcomes: [],
        materials: {},
        metrics: {},
        published: true,
        children: [],
        contributors: [],
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
        abstracts: [],
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
        completedParts: [],
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
    ACCESS_GROUPS: ['admin', 'editor', 'curator'],
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
