export interface ElasticSearchQuery {
  size: number;
  query: {
    bool: {
      should: [
        {
          multi_match: {
            fields: string[];
            query: string;
            fuzziness: string;
            slop: number;
            analyzer: string;
          };
        },
        {
          match_phrase_prefix: {
            description: {
              query: string;
              max_expansions: number;
              slop: number;
            };
          };
        }
      ];
    };
  };
}

export interface PostFilterQuery {
  bool: {
    must: [
      {
        terms: {
          [x: string]: any;
        };
      }
    ];
  };
}

export interface FilteredElasticSearchQuery {
  query: ElasticSearchQuery;
  post_filter: PostFilterQuery;
}
