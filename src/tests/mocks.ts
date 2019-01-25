

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
    REQUIRED_ACCESS_GROUPS_CURATOR: ['admin', 'editor', 'curator'],
    REQUIRED_ACCESS_GROUPS_CURATOR_UNSORTED: ['curator', 'editor', 'admin'],
    REQUIRED_ACCESS_GROUPS_REVIEWER: ['admin', 'editor', 'reviewer'],
    REQUIRED_ACCESS_GROUPS_REVIEWER_UNSORTED: ['reviewer', 'editor', 'admin'],
    ACCESS_GROUPS: ['admin', 'editor', 'curator@secj'],
    ACCESS_GROUPS_MULTIPLE_CURATORS_UNSORTED: ['curator@secj', 'editor', 'curator@nccp'],
    ACCESS_GROUPS_CURATOR: ['curator@secj'],
    ACCESS_GROUPS_REVIEWER_SECJ: ['reviewer@secj'],
    ACCESS_GROUPS_REVIEWER_NCCP: ['reviewer@nccp'],
    ABV_COLLECTION_NAME: 'nccp',
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
          remember: 1
        }
    },
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
