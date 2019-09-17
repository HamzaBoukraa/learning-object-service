const {MongoClient, ObjectID} = require('mongodb');
const SEED = require('./data')

let connection;
let db;

async function seedDatabase(uri){ 
    console.log(uri)
    connection = await MongoClient.connect(uri);
    db = connection.db();
    
    await db.createCollection('objects');
    await db.createCollection('released-objects');
    await db.createCollection('users');
    await db.createCollection('collections');
    await db.createCollection('changelogs');
    await db.createCollection('outcomes');
    await db.createCollection('learning-outcomes');

    await db.collection('objects').insert([
        SEED.USER_SEARCH_LEARNING_OBJECT_RELEASED,
        SEED.USER_SEARCH_LEARNING_OBJECT_PROOFING,
        SEED.USER_SEARCH_LEARNING_OBJECT_REVIEW,
        SEED.USER_SEARCH_LEARNING_OBJECT_WAITING,
        SEED.USER_SEARCH_LEARNING_OBJECT_WAITING_C5,
        SEED.USER_SEARCH_LEARNING_OBJECT_UNRELEASED,
        SEED.LEARNING_OBJECT_RELEASED_1,
        SEED.LEARNING_OBJECT_CHILD,
        SEED.LEARNING_OBJECT_WAITING,
        SEED.LEARNING_OBJECT_UNRELEASED,
        SEED.LEARNING_OBJECT_CHILD_WAITING]);
    await db.collection('released-objects').insertMany([
        SEED.USER_SEARCH_LEARNING_OBJECT_RELEASED,
        SEED.LEARNING_OBJECT_RELEASED_1,
        SEED.LEARNING_OBJECT_CHILD]);
    await db.collection('users').insertMany([
        SEED.SEARCH_USER_AUTHOR,
        SEED.AUTHOR_MOCK,
        SEED.ADMIN_MOCK,
        SEED.CURATOR_MOCK,
        SEED.EDITOR_MOCK,
        SEED.REVIEWER_MOCK]);
    await db.collection('collections').insertOne(SEED.C5_COLLECTION_MOCK);
    await db.collection('changelogs').insertOne(SEED.CHANGELOG_MOCK);
    await db.collection('outcomes').insertOne(SEED.OUTCOME_MOCK);
    await db.collection('learning-outcomes').insertOne(SEED.LEARNING_OUTCOME_MOCK);
}

module.exports = seedDatabase;
