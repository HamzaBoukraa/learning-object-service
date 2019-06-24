const request = require('request-promise');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const searchURI = process.env.LEARNING_OBJECT_API ? process.env.LEARNING_OBJECT_API : `http://localhost:5000`;

/**
 * Makes a request to Learning Object Service to search for Learning Objects
 * Creates Bearer token based off of given privilege
 * 
 * @param query string
 * @param privilege string : user/visitor|reviewer@collecitonName|curator@collectionName|editor|admin
 */
export async function searchLearningObjects(query, privilege) {
    try {
        const token = generateUserToken(privilege);
        
        const response = await request({
            method: 'GET',
            uri: searchURI + `/learning-objects?text=${query}&currPage=1&limit=20`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
        });
        if (response) {
            fs.writeFile('response.txt', response);
            return JSON.parse(response);
        }
        throw new Error('Unexpected response');

    } catch (err) {
        console.log(err);
        throw err;
    }
}

/**
 * Creates Bearer token based off of given privilege
 * @param privilege string : user/visitor|reviewer@collecitonName|curator@collectionName|editor|admin
 */
function generateUserToken(privilege) {
    const payload = {
        id: 'test_id',
        username: 'test123',
        name: 'test account',
        email: 'test@gmail.com',
        organization: 'test',
        emailVerified: true,
        accessGroups: [privilege]
    };
    const options = {
        issuer: process.env.ISSUER,
        expiresIn: 86400,
        audience: 'test123'
    };
    const token = jwt.sign(payload, process.env.KEY, options);
    return token;
}


