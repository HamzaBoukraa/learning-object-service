const {MongoClient, ObjectID} = require('mongodb');

let connection;
let db;

const LEARNING_OBJECT_MOCK = { 
    _id: "5ad8f5a6824dd17351adf1e1",
    authorID: "5b967621f7a3ce2f6cbf5ba1",
    date:"1520530093085",
    goals:[
    {
        text: "Random text goal"
    },
    { 
        text: "Random text goal 2"
    }
    ],
    outcomes:[],
    published: true,
    name: "Learn Unit Testing",
    length:"nanomodule",
    materials:
    {
        files:[],
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
        folderDescriptions: [],
        pdf:
        {
            name:"0ReadMeFirst - Buffer Overflow - CS0 - C++.pdf",
            url:"https://neutrino-file-uploads.s3.us-east-2.amazonaws.com/skaza/5aa0013becba9a264dcd8030/0ReadMeFirst%20-%20Buffer%20Overflow%20-%20CS0%20-%20C%2B%2B.pdf"
        }
    },
    levels:["undergraduate"],
    contributors:[],
    collection:"secinj",
    lock:
        {
            date:"1538061211867",
            restrictions:[]
        },
    status:"published"
}

const USER_MOCK = { 
    _id: "5b967621f7a3ce2f6cbf5ba1",
    username: "unittester",
    name: "Uncle Bob",
    email: "unitTest12@gmail.com",
    organization: "Towson University",
    password: '$2b$10$Xo4wAJimokUp8Yha4c9boeiFufdf/UnxEuhbGHNuFrgqkHp.96P5a', //hash of 'password',
    objects:[],
    emailVerified: true,
    bio: "random text random text random text random text random text random text random text random text random text random text",
    createdAt:"1534558693394"
}

const SECJ_COLLECTION_MOCK = {
    _id: "5b967621f7a3ce2f6cbf5b78",
    name:"Security Injections", 
    learningObjects:[objects.ops[0]._id],
    abvName:"secinj",
    hasLogo:true
}

const C5_COLLECTION_MOCK = {
    _id: "5b967621f7a3ce2f6cbf5b10",
    name:"C5",
    fullName:"Catalyzing Computing and Cybersecurity in Community Colleges",
    abvName:"c5",
    hasLogo:true,
    description:"<p><strong>Catalyzing Computing and Cybersecurity in Community Colleges (C5)</strong>&nbsp;is a project funded by the National Science Foundation. It supports the creation of a nationwide network of community colleges that have met national standards in cybersecurity education, producing more and better-prepared graduates for the workforce, and ultimately leading to a more secure nation.</p><p>C5 seeks to strengthen and expand the number of community colleges across the nation that have earned the NSA/DHS National Center of Academic Excellence (CAE) designation for cybersecurity education. The project supports the CAE Application Assistance Program by matching approved mentee institutions with qualified mentors who assist them with the application process.</p><p>C5 also brings together computer science and cybersecurity educators to develop new course content that integrates the two disciplines. The resulting modules can be seamlessly incorporated into existing computing or cybersecurity courses, or bundled to create an introductory cybersecurity-infused computer science course.</p><p>The project is administered by&nbsp;<a href=\"http://www.whatcom.edu/\" target=\"_blank\">Whatcom Community College</a>&nbsp;in Bellingham, Washington. Members of the C5 Leadership Team have extensive experience and expertise and are recognized for their commitment to excellence in cybersecurity and computing education, and for their approach to producing results and successfully managing National Science Foundation projects.</p>"
}

const CHANGELOG_MOCK = {
    _id: "5c3e2cab7da238008fcd771c",
    learningObjectId: "5ad8f5a6824dd17351adf1e1",
    logs:[
        {
            userId:"1234",
            date:"2019-01-15T18:55:39.000Z",
            text:"hello two"
        }
    ]
}

const OUTCOME_MOCK = {
        _id: "5a674e2d04aa5f2a5ce97d10",
        author: "NICE Workforce Framework Tasks",
        date: "2017",
        outcome:"Employ secure configuration management processes.",
        source:"NCWF Tasks",
        tag:"2017$T0084$Employ secure configuration management processes.",
        name:"T0084"
}

const LEARNING_OUTCOME_MOCK = {
    _id:"5af72b914803270dfc9aeae4",
    source:"5af72b914803270dfc9aeae2",
    tag:1,
    author:"xinwen fu",
    name:"IoT [09] - System Security",
    date:"1539726409073",
    outcome:"Explain TrustZone hardware architecture",
    bloom:"Remember and Understand",
    verb:"Explain",
    text:"TrustZone hardware architecture",
    assessments:[],
    strategies:[],
    mappings:["5a674e2d04aa5f2a5ce97b0e"]
}

async function seedDatabase(uri){ 
    console.log(uri)
    connection = await MongoClient.connect(uri);
    db = connection.db();
    
    await db.createCollection('objects');
    await db.createCollection('users');
    await db.createCollection('collections');
    await db.createCollection('changelogs');
    await db.createCollection('outcomes');
    await db.createCollection('learning-outcomes');

    await db.collection('objects').insertOne(LEARNING_OBJECT_MOCK);
    await db.collection('users').insertOne(USER_MOCK);
    await db.collection('collections').insertOne(C5_COLLECTION_MOCK);
    await db.collection('changlogs').insertOne(CHANGELOG_MOCK);
    await db.collection('outcomes').insertOne(OUTCOME_MOCK);
    await db.collection('learning-outcomes').insertOne(LEARNING_OUTCOME_MOCK);
}

module.exports = seedDatabase;