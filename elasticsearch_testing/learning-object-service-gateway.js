const request = require('request-promise');
var jwt = require('jsonwebtoken');

const searchURI = process.env.LEARNING_OBJECT_API ? process.env.LEARNING_OBJECT_API : `http://localhost:5000/`;

export async function searchLearningObjects(query, privilege) {
    try {
        const token = generateUserToken(privilege);
        
        const response = await request({
            method: 'GET',
            uri: searchURI + `learning-objects?text=${query}&currPage=1&limit=20`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
        });
        if (response) {
            return JSON.parse(response);
        }
        throw new Error('Unexpected response');

    } catch (err) {
        console.log(err);
        throw err;
    }
}

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


