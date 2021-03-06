// This learning object is in the objects collection and the released collection
const IDS = require('./sharedIds');

const SEED_OBJECTS = {

    USER_SEARCH_LEARNING_OBJECT_RELEASED: {
        _id: IDS.USER_SEARCH.RELEASED,
        authorID: IDS.AUTHOR.User_Search,
        date: "1520530093085",
        goals: [
            {
                text: "Random text goal"
            },
            {
                text: "Random text goal 2"
            }
        ],
        outcomes: [],
        published: true,
        name: "Learn Unit Testing",
        length: "nanomodule",
        materials:
        {
            files: [],
            urls: [
                {
                    title: "An Awesome File",
                    url: "http://cis1.towson.edu/~cyber4all/modules/nanomodules/Buffer_Overflow-CS0_C++.html"
                },
                {
                    title: "Another Awesome File",
                    url: "https://youtu.be/MH_RD1jh0AE"
                },
                {
                    title: "Yeet",
                    url: "https://youtu.be/u47q-qX52JI"
                }
            ],
            notes: "",
            folderDescriptions: [],
            pdf:
            {
                name: "0ReadMeFirst - Buffer Overflow - CS0 - C++.pdf",
                url: "https://neutrino-file-uploads.s3.us-east-2.amazonaws.com/skaza/5aa0013becba9a264dcd8030/0ReadMeFirst%20-%20Buffer%20Overflow%20-%20CS0%20-%20C%2B%2B.pdf"
            }
        },
        children: [],
        levels: ["undergraduate"],
        contributors: [],
        collection: "secinj",
        lock:
        {
            date: "1538061211867",
            restrictions: []
        },
        status: "released"
    },

    USER_SEARCH_LEARNING_OBJECT_UNRELEASED: {
        _id: IDS.USER_SEARCH.UNRELEASED,
        authorID: IDS.AUTHOR.User_Search,
        date: "1520530093085",
        goals: [
            {
                text: "Random text goal"
            },
            {
                text: "Random text goal 2"
            }
        ],
        outcomes: [],
        published: true,
        name: "Learn Unit Testing",
        length: "nanomodule",
        materials:
        {
            files: [],
            urls: [
                {
                    title: "An Awesome File",
                    url: "http://cis1.towson.edu/~cyber4all/modules/nanomodules/Buffer_Overflow-CS0_C++.html"
                },
                {
                    title: "Another Awesome File",
                    url: "https://youtu.be/MH_RD1jh0AE"
                },
                {
                    title: "Yeet",
                    url: "https://youtu.be/u47q-qX52JI"
                }
            ],
            notes: "",
            folderDescriptions: [],
            pdf:
            {
                name: "0ReadMeFirst - Buffer Overflow - CS0 - C++.pdf",
                url: "https://neutrino-file-uploads.s3.us-east-2.amazonaws.com/skaza/5aa0013becba9a264dcd8030/0ReadMeFirst%20-%20Buffer%20Overflow%20-%20CS0%20-%20C%2B%2B.pdf"
            }
        },
        children: [],
        levels: ["undergraduate"],
        contributors: [],
        collection: "secinj",
        lock:
        {
            date: "1538061211867",
            restrictions: []
        },
        status: "unreleased"
    },

    USER_SEARCH_LEARNING_OBJECT_WAITING: {
        _id: IDS.USER_SEARCH.WAITING,
        authorID: IDS.AUTHOR.User_Search,
        date: "1520530093085",
        goals: [
            {
                text: "Random text goal"
            },
            {
                text: "Random text goal 2"
            }
        ],
        outcomes: [],
        published: true,
        name: "Learn Unit Testing",
        length: "nanomodule",
        materials:
        {
            files: [],
            urls: [
                {
                    title: "An Awesome File",
                    url: "http://cis1.towson.edu/~cyber4all/modules/nanomodules/Buffer_Overflow-CS0_C++.html"
                },
                {
                    title: "Another Awesome File",
                    url: "https://youtu.be/MH_RD1jh0AE"
                },
                {
                    title: "Yeet",
                    url: "https://youtu.be/u47q-qX52JI"
                }
            ],
            notes: "",
            folderDescriptions: [],
            pdf:
            {
                name: "0ReadMeFirst - Buffer Overflow - CS0 - C++.pdf",
                url: "https://neutrino-file-uploads.s3.us-east-2.amazonaws.com/skaza/5aa0013becba9a264dcd8030/0ReadMeFirst%20-%20Buffer%20Overflow%20-%20CS0%20-%20C%2B%2B.pdf"
            }
        },
        children: [],
        levels: ["undergraduate"],
        contributors: [],
        collection: "secinj",
        lock:
        {
            date: "1538061211867",
            restrictions: []
        },
        status: "waiting"
    },


    USER_SEARCH_LEARNING_OBJECT_WAITING_C5: {
        _id: IDS.USER_SEARCH.WAITING_C5,
        authorID: IDS.AUTHOR.User_Search,
        date: "1520530093085",
        goals: [
            {
                text: "Random text goal"
            },
            {
                text: "Random text goal 2"
            }
        ],
        outcomes: [],
        published: true,
        name: "Learn Unit Testing",
        length: "nanomodule",
        materials:
        {
            files: [],
            urls: [
                {
                    title: "An Awesome File",
                    url: "http://cis1.towson.edu/~cyber4all/modules/nanomodules/Buffer_Overflow-CS0_C++.html"
                },
                {
                    title: "Another Awesome File",
                    url: "https://youtu.be/MH_RD1jh0AE"
                },
                {
                    title: "Yeet",
                    url: "https://youtu.be/u47q-qX52JI"
                }
            ],
            notes: "",
            folderDescriptions: [],
            pdf:
            {
                name: "0ReadMeFirst - Buffer Overflow - CS0 - C++.pdf",
                url: "https://neutrino-file-uploads.s3.us-east-2.amazonaws.com/skaza/5aa0013becba9a264dcd8030/0ReadMeFirst%20-%20Buffer%20Overflow%20-%20CS0%20-%20C%2B%2B.pdf"
            }
        },
        children: [],
        levels: ["undergraduate"],
        contributors: [],
        collection: "c5",
        lock:
        {
            date: "1538061211867",
            restrictions: []
        },
        status: "waiting"
    },


    USER_SEARCH_LEARNING_OBJECT_REVIEW: {
        _id: IDS.USER_SEARCH.REVIEW,
        authorID: IDS.AUTHOR.User_Search,
        date: "1520530093085",
        goals: [
            {
                text: "Random text goal"
            },
            {
                text: "Random text goal 2"
            }
        ],
        outcomes: [],
        published: true,
        name: "Learn Unit Testing",
        length: "nanomodule",
        materials:
        {
            files: [],
            urls: [
                {
                    title: "An Awesome File",
                    url: "http://cis1.towson.edu/~cyber4all/modules/nanomodules/Buffer_Overflow-CS0_C++.html"
                },
                {
                    title: "Another Awesome File",
                    url: "https://youtu.be/MH_RD1jh0AE"
                },
                {
                    title: "Yeet",
                    url: "https://youtu.be/u47q-qX52JI"
                }
            ],
            notes: "",
            folderDescriptions: [],
            pdf:
            {
                name: "0ReadMeFirst - Buffer Overflow - CS0 - C++.pdf",
                url: "https://neutrino-file-uploads.s3.us-east-2.amazonaws.com/skaza/5aa0013becba9a264dcd8030/0ReadMeFirst%20-%20Buffer%20Overflow%20-%20CS0%20-%20C%2B%2B.pdf"
            }
        },
        children: [],
        levels: ["undergraduate"],
        contributors: [],
        collection: "secinj",
        lock:
        {
            date: "1538061211867",
            restrictions: []
        },
        status: "review"
    },

    USER_SEARCH_LEARNING_OBJECT_PROOFING: {
        _id: IDS.USER_SEARCH.PROOFING,
        authorID: IDS.AUTHOR.User_Search,
        date: "1520530093085",
        goals: [
            {
                text: "Random text goal"
            },
            {
                text: "Random text goal 2"
            }
        ],
        outcomes: [],
        published: true,
        name: "Learn Unit Testing",
        length: "nanomodule",
        materials:
        {
            files: [],
            urls: [
                {
                    title: "An Awesome File",
                    url: "http://cis1.towson.edu/~cyber4all/modules/nanomodules/Buffer_Overflow-CS0_C++.html"
                },
                {
                    title: "Another Awesome File",
                    url: "https://youtu.be/MH_RD1jh0AE"
                },
                {
                    title: "Yeet",
                    url: "https://youtu.be/u47q-qX52JI"
                }
            ],
            notes: "",
            folderDescriptions: [],
            pdf:
            {
                name: "0ReadMeFirst - Buffer Overflow - CS0 - C++.pdf",
                url: "https://neutrino-file-uploads.s3.us-east-2.amazonaws.com/skaza/5aa0013becba9a264dcd8030/0ReadMeFirst%20-%20Buffer%20Overflow%20-%20CS0%20-%20C%2B%2B.pdf"
            }
        },
        children: [],
        levels: ["undergraduate"],
        contributors: [],
        collection: "secinj",
        lock:
        {
            date: "1538061211867",
            restrictions: []
        },
        status: "proofing"
    },

    LEARNING_OBJECT_RELEASED_1: {
        _id: IDS.PARENT.released_1,
        cuid: '91db69aa-a9c9-4235-a985-1996fd9559ce',
        authorID: IDS.AUTHOR.Bob,
        date: "1520530093085",
        goals: [
            {
                text: "Random text goal"
            },
            {
                text: "Random text goal 2"
            }
        ],
        outcomes: [],
        published: true,
        name: "Learn Unit Testing",
        length: "nanomodule",
        materials:
        {
            files: [],
            urls: [
                {
                    title: "An Awesome File",
                    url: "http://cis1.towson.edu/~cyber4all/modules/nanomodules/Buffer_Overflow-CS0_C++.html"
                },
                {
                    title: "Another Awesome File",
                    url: "https://youtu.be/MH_RD1jh0AE"
                },
                {
                    title: "Yeet",
                    url: "https://youtu.be/u47q-qX52JI"
                }
            ],
            notes: "",
            folderDescriptions: [],
            pdf:
            {
                name: "0ReadMeFirst - Buffer Overflow - CS0 - C++.pdf",
                url: "https://neutrino-file-uploads.s3.us-east-2.amazonaws.com/skaza/5aa0013becba9a264dcd8030/0ReadMeFirst%20-%20Buffer%20Overflow%20-%20CS0%20-%20C%2B%2B.pdf"
            }
        },
        children: [IDS.CHILD.released_1, IDS.CHILD.waiting_1],
        levels: ["undergraduate"],
        contributors: [],
        collection: "secinj",
        lock:
        {
            date: "1538061211867",
            restrictions: []
        },
        status: "released"
    },

    LEARNING_OBJECT_UNRELEASED: {
        authorID: IDS.AUTHOR.Bob,
        name: 'JAVA Stuff',
        date: '1523479539864',
        length: 'nanomodule',
        levels: [],
        goals: [],
        outcomes: [],
        materials:
        {
            files: [],
            urls: [
                {
                    title: "An Awesome File",
                    url: "http://cis1.towson.edu/~cyber4all/modules/nanomodules/Buffer_Overflow-CS0_C++.html"
                },
                {
                    title: "Another Awesome File",
                    url: "https://youtu.be/MH_RD1jh0AE"
                },
                {
                    title: "Yeet",
                    url: "https://youtu.be/u47q-qX52JI"
                }
            ],
            notes: "",
            folderDescriptions: [],
            pdf:
            {
                name: "0ReadMeFirst - Buffer Overflow - CS0 - C++.pdf",
                url: "https://neutrino-file-uploads.s3.us-east-2.amazonaws.com/skaza/5aa0013becba9a264dcd8030/0ReadMeFirst%20-%20Buffer%20Overflow%20-%20CS0%20-%20C%2B%2B.pdf"
            }
        },
        metrics: {},
        children: [IDS.CHILD.waiting_1],
        contributors: [],
        collection: 'nccp',
        _id: IDS.PARENT.unreleased_1,
        status: 'unreleased',
    },
    LEARNING_OBJECT_WAITING: {
        authorID: IDS.AUTHOR.Bob,
        name: 'C++ Validator',
        date: '1523479539898',
        length: 'nanomodule',
        levels: [],
        goals: [],
        outcomes: [],
        materials:
        {
            files: [],
            urls: [
                {
                    title: "An Awesome File",
                    url: "http://cis1.towson.edu/~cyber4all/modules/nanomodules/Buffer_Overflow-CS0_C++.html"
                },
                {
                    title: "Another Awesome File",
                    url: "https://youtu.be/MH_RD1jh0AE"
                },
                {
                    title: "Yeet",
                    url: "https://youtu.be/u47q-qX52JI"
                }
            ],
            notes: "",
            folderDescriptions: [],
            pdf:
            {
                name: "0ReadMeFirst - Buffer Overflow - CS0 - C++.pdf",
                url: "https://neutrino-file-uploads.s3.us-east-2.amazonaws.com/skaza/5aa0013becba9a264dcd8030/0ReadMeFirst%20-%20Buffer%20Overflow%20-%20CS0%20-%20C%2B%2B.pdf"
            }
        },
        metrics: {},
        children: [IDS.CHILD.released_1],
        contributors: [],
        collection: 'nccp',
        _id: IDS.PARENT.waiting_1,
        status: 'waiting',
    },

    LEARNING_OBJECT_CHILD_WAITING: {
        authorID: IDS.AUTHOR.Bob,
        name: 'Input Validation - CS0 - C',
        date: '1523479539862',
        length: 'nanomodule',
        levels: [],
        goals: [],
        outcomes: [],
        materials:
        {
            files: [],
            urls: [
                {
                    title: "An Awesome File",
                    url: "http://cis1.towson.edu/~cyber4all/modules/nanomodules/Buffer_Overflow-CS0_C++.html"
                },
                {
                    title: "Another Awesome File",
                    url: "https://youtu.be/MH_RD1jh0AE"
                },
                {
                    title: "Yeet",
                    url: "https://youtu.be/u47q-qX52JI"
                }
            ],
            notes: "",
            folderDescriptions: [],
            pdf:
            {
                name: "0ReadMeFirst - Buffer Overflow - CS0 - C++.pdf",
                url: "https://neutrino-file-uploads.s3.us-east-2.amazonaws.com/skaza/5aa0013becba9a264dcd8030/0ReadMeFirst%20-%20Buffer%20Overflow%20-%20CS0%20-%20C%2B%2B.pdf"
            }
        },
        metrics: {},
        children: [],
        contributors: [],
        collection: 'secinj',
        _id: IDS.CHILD.waiting_1,
        status: 'waiting',
    },

    LEARNING_OBJECT_CHILD: {
        authorID: IDS.AUTHOR.Bob,
        name: 'Input Validation - CS0 - C',
        date: '1523479539862',
        length: 'nanomodule',
        levels: ['undergraduate'],
        goals: [],
        outcomes: [],
        materials:
        {
            files: [],
            urls: [
                {
                    title: "An Awesome File",
                    url: "http://cis1.towson.edu/~cyber4all/modules/nanomodules/Buffer_Overflow-CS0_C++.html"
                },
                {
                    title: "Another Awesome File",
                    url: "https://youtu.be/MH_RD1jh0AE"
                },
                {
                    title: "Yeet",
                    url: "https://youtu.be/u47q-qX52JI"
                }
            ],
            notes: "",
            folderDescriptions: [],
            pdf:
            {
                name: "0ReadMeFirst - Buffer Overflow - CS0 - C++.pdf",
                url: "https://neutrino-file-uploads.s3.us-east-2.amazonaws.com/skaza/5aa0013becba9a264dcd8030/0ReadMeFirst%20-%20Buffer%20Overflow%20-%20CS0%20-%20C%2B%2B.pdf"
            }
        },
        metrics: {},
        children: [],
        contributors: [],
        collection: 'nccp',
        _id: IDS.CHILD.released_1,
        status: 'released',
    },
    SEARCH_USER_AUTHOR: {
        _id: IDS.AUTHOR.User_Search,
        username: "Nick",
        name: "Uncle Nick",
        email: "unitTest2@gmail.com",
        organization: "Towson University",
        password: '$2b$10$Xo4wAJimokUp8Yha4c9boeiFufdf/UnxEuhbGHNuFrgqkHp.96P5a', //hash of 'password',
        objects: [],
        bio: "random text random text random text random text random text random text random text random text random text random text",
        createdAt: "1534558693394",
        emailVerified: true,
    },
    AUTHOR_MOCK: {
        _id: IDS.AUTHOR.Bob,
        username: "Bob",
        name: "Uncle Bob",
        email: "unitTest1@gmail.com",
        organization: "Towson University",
        password: '$2b$10$Xo4wAJimokUp8Yha4c9boeiFufdf/UnxEuhbGHNuFrgqkHp.96P5a', //hash of 'password',
        objects: ['parent_object_1', 'child_object_1'],
        bio: "random text random text random text random text random text random text random text random text random text random text",
        createdAt: "1534558693394",
        emailVerified: true,
    },
    ADMIN_MOCK: {
        _id: IDS.PRIVILEGED_USER.admin,
        username: "Admin_Anne",
        name: "Anne",
        email: "unitTest2@gmail.com",
        organization: "Towson University",
        password: '$2b$10$Xo4wAJimokUp8Yha4c9boeiFufdf/UnxEuhbGHNuFrgqkHp.96P5a', //hash of 'password',
        objects: [],
        // tslint:disable-next-line
        emailVerified: true,
        bio: "random text random text random text random text random text random text random text random text random text random text",
        createdAt: "1534558693394",
        accessGroups: ['admin']
    },

    CURATOR_MOCK: {
        _id: IDS.PRIVILEGED_USER.curator,
        username: "curator_cook",
        name: "cookies",
        email: "unitTest3@gmail.com",
        organization: "Towson University",
        password: '$2b$10$Xo4wAJimokUp8Yha4c9boeiFufdf/UnxEuhbGHNuFrgqkHp.96P5a', //hash of 'password',
        objects: [],
        emailVerified: true,
        bio: "random text random text random text random text random text random text random text random text random text random text",
        createdAt: "1534558693394",
        accessGroups: ['curator@nccp']
    },

    EDITOR_MOCK: {
        _id: IDS.PRIVILEGED_USER.editor,
        username: "editor_eddy",
        name: "Eddy woo",
        email: "unitTest4@gmail.com",
        organization: "Towson University",
        password: '$2b$10$Xo4wAJimokUp8Yha4c9boeiFufdf/UnxEuhbGHNuFrgqkHp.96P5a', //hash of 'password',
        objects: [],
        emailVerified: true,
        bio: "random text random text random text random text random text random text random text random text random text random text",
        createdAt: "1534558693394",
        accessGroups: ['editor']
    },

    REVIEWER_MOCK: {
        _id: IDS.PRIVILEGED_USER.reviewer,
        username: 'reviewer_ryan',
        name: "Eddy woo",
        email: "unitTest5@gmail.com",
        organization: "Towson University",
        password: '$2b$10$Xo4wAJimokUp8Yha4c9boeiFufdf/UnxEuhbGHNuFrgqkHp.96P5a', //hash of 'password',
        objects: [],
        emailVerified: true,
        bio: "random text random text random text random text random text random text random text random text random text random text",
        createdAt: "1534558693394",
        accessGroups: ['curator@nccp']
    },

    SECJ_COLLECTION_MOCK: {
        _id: "5b967621f7a3ce2f6cbf5b78",
        name: "Security Injections",
        learningObjects: ['5ad8f5a6824dd17351adf1e1'],
        abvName: "secinj",
        hasLogo: true
    },

    C5_COLLECTION_MOCK: {
        _id: "5b967621f7a3ce2f6cbf5b10",
        name: "C5",
        fullName: "Catalyzing Computing and Cybersecurity in Community Colleges",
        abvName: "c5",
        hasLogo: true,
        description: "<p><strong>Catalyzing Computing and Cybersecurity in Community Colleges (C5)</strong>&nbsp;is a project funded by the National Science Foundation. It supports the creation of a nationwide network of community colleges that have met national standards in cybersecurity education, producing more and better-prepared graduates for the workforce, and ultimately leading to a more secure nation.</p><p>C5 seeks to strengthen and expand the number of community colleges across the nation that have earned the NSA/DHS National Center of Academic Excellence (CAE) designation for cybersecurity education. The project supports the CAE Application Assistance Program by matching approved mentee institutions with qualified mentors who assist them with the application process.</p><p>C5 also brings together computer science and cybersecurity educators to develop new course content that integrates the two disciplines. The resulting modules can be seamlessly incorporated into existing computing or cybersecurity courses, or bundled to create an introductory cybersecurity-infused computer science course.</p><p>The project is administered by&nbsp;<a href:\"http://www.whatcom.edu/\" target:\"_blank\">Whatcom Community College</a>&nbsp;in Bellingham, Washington. Members of the C5 Leadership Team have extensive experience and expertise and are recognized for their commitment to excellence in cybersecurity and computing education, and for their approach to producing results and successfully managing National Science Foundation projects.</p>"
    },
    CHANGELOG_MOCK: {
        _id: "5c3e2cab7da238008fcd771c",
        learningObjectId: IDS.PARENT.released_1,
        logs: [
            {
                userId: "1234",
                date: "2019-01-15T18:55:39.000Z",
                text: "hello"
            },
            {
                userId: "5678",
                date: "2019-01-15T18:55:39.000Z",
                text: "hello two"
            }
        ]
    },
    OUTCOME_MOCK: {
        _id: IDS.OUTCOME.NICE,
        author: "NICE Workforce Framework Tasks",
        date: "2017",
        outcome: "Employ secure configuration management processes.",
        source: "NCWF Tasks",
        tag: "2017$T0084$Employ secure configuration management processes.",
        name: "T0084"
    },
    LEARNING_OUTCOME_MOCK: {
        _id: IDS.OUTCOME.EXPLAIN,
        source: "5af72b914803270dfc9aeae2",
        tag: 1,
        author: "xinwen fu",
        name: "IoT [09] - System Security",
        date: "1539726409073",
        outcome: "Explain TrustZone hardware architecture",
        bloom: "Remember and Understand",
        verb: "Explain",
        text: "TrustZone hardware architecture",
        assessments: [],
        strategies: [],
        mappings: ["5a674e2d04aa5f2a5ce97b0e"]
    },
    STANDARD_OUTCOME: {
        _id: '5a674e2d04aa5f2a5ce97d7f',
        author: 'NICE Workforce Framework KSAs',
        date: '2017',
        outcome: 'Knowledge of concepts, terminology, and operations of a wide range of ...',
        source: 'NCWF KSAs',
        name: 'K0108',
    },
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
    FILETYPES: ['video', 'powerpoint', 'document'],
}

module.exports = SEED_OBJECTS;
