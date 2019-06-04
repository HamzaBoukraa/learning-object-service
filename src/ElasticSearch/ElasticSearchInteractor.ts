import * as request from 'request-promise'
import { levels } from '@cyber4all/clark-taxonomy';
import { text } from 'body-parser';
import { elasticSearchQuery } from './types';

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
    'outcomes.outcome'];

const mockElasticSearchURI = `http://localhost:9200/released_objects/_search?`
export class ElasticSearchInteractor {

    buildElasticSearchQuery(params: {
        collection: String[],
        length: String[],
        levels: String[],
        text: String,
        orderBy: String,
        sortType: Number,
    }):Partial<elasticSearchQuery>
    {
        let query: elasticSearchQuery;
        return query;
    }

}