
 type SortOrder = 'asc' | 'desc'
export interface ElasticSearchQuery {
  size: number;
  query: QueryOperation;
  sort?: SortOperation;
  post_filter?: QueryOperation;
}

export interface SortOperation{
  [orderBy: string]: { order: SortOrder }
}

//  type LogicalOperator = 'must' | 'should'



 type QueryOperation = BoolOperation | MultiMatchQuery | MatchPhrasePrefixQuery |TermQuery | TermsQuery

 export interface BoolOperation{
  bool: {should?: QueryOperation[], must?: QueryOperation[]}
}


export interface MultiMatchQuery{
  multi_match: {
    fields: string[];
    query: string;
    fuzziness: string;
    slop: number;
    analyzer: string;
  }
}

export interface MatchPhrasePrefixQuery {
  match_phrase_prefix: {
    description: {
      query: string;
      max_expansions: number;
      slop: number;
    };
  }
}

export interface TermQuery{
  term?: {
    [property: string]: {
      value: any,
    },
  },
}

export interface TermsQuery{
  terms?: {
    [property: string]: any[]
  },
}