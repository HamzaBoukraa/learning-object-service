const request = require('request-promise');

class ElasticSearchService {

    searchURI;
    constructor() {
        this.searchURI = process.env.LEARNING_OBJECT_API ? process.env.LEARNING_OBJECT_API  : `http://localhost:5000/`
    }

    searchLearningObjects(query) {
        return request({
            method: 'GET',
            uri: this.searchURI + `learning-objects?text=${query}&currPage=1&limit=20`,
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then((response) => {
            const result = response.data;
            return new Promise((resolve) => {
                try {
                    resolve(result);
                } catch (error) {
                    throw error;
                }
            })
        })
        .catch((err) => {
            console.error(err);
        })
    }

    insertElasticsearchTestData() {
        
    }
}

export default ElasticSearchService;

