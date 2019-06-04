export interface ElasticSearchGateway {

}

export type elasticSearchQuery = {
    size: number,
    query: {
        bool: {
            should: [{
                multi_match: {
                    fields: string[]
                    query: string,
                    fuzziness: string,
                    Slop: number,
                    analyzer: string,
                },
            },
                {
                    match_phrase_prefix: {
                        description: {
                            query: string,
                            max_expansions: number,
                            slop: number,
                        },
                    },
                },
            ],
        },
    },
};

export type filteredElasticSearchQuery = {
    query: elasticSearchQuery;
    post_filter: {
        bool: {
            should: [
                {
                    match: {
                        [x: string]: {
                            query: string,
                        },
                    },
                },
            ],
        },
    },
};
