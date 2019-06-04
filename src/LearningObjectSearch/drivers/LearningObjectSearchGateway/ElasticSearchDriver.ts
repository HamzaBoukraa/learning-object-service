import {
  ElasticSearchQuery,
  FilteredElasticSearchQuery,
  ReleasedLearningObjectSearchQuery,
  LearningObjectSearchQuery,
  LearningObjectSearchResult,
} from '../../typings';
import { LearningObjectSearchGateway } from '../../interfaces';

const SEARCHABLE_FIELDS = [
  'name',
  'levels',
  'collection.keyword',
  'description',
  'author.name',
  'author.email',
  'author.organization',
  'outcomes.text',
  'outcomes.bloom',
  'outcomes.outcome',
];

const DEFAULT_QUERY_SIZE = 200;

export class ElasticSearchDriver implements LearningObjectSearchGateway {
  searchReleasedObjects(
    params: ReleasedLearningObjectSearchQuery,
  ): Promise<LearningObjectSearchResult> {
    this.buildSearchQuery(params);
    throw new Error('Method not implemented.');
  }
  searchAllObjects(
    params: LearningObjectSearchQuery,
  ): Promise<LearningObjectSearchResult> {
    throw new Error('Method not implemented.');
  }
  private buildSearchQuery({
    text,
    length,
    level,
    collection,
  }: ReleasedLearningObjectSearchQuery) {
    let body: ElasticSearchQuery = {
      size: DEFAULT_QUERY_SIZE,
      query: {
        bool: {
          should: [
            {
              multi_match: {
                fields: SEARCHABLE_FIELDS,
                query: text,
                fuzziness: 'AUTO',
                slop: 3,
                analyzer: 'stop',
              },
            },
            {
              match_phrase_prefix: {
                description: {
                  query: text,
                  max_expansions: 50,
                  slop: 50,
                },
              },
            },
          ],
        },
      },
    };
    const post_filter = {
      bool: {
        should: [
          {
            match: {
              length: '',
            },
          },
        ],
      },
    };
    if (length) {
      
      length.forEach((length: string) => {
        post_filter.bool.should.push({ match: { length: len } });
      });
    }
    if(level){
      level.forEach()
      post_filter.bool.should.push({ match: { length: len } });
    }
  }
}
