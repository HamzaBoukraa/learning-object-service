
import assertNever from 'assert-never';

import { HashInterface, DataStore } from '../interfaces/interfaces';

import {

    LearningObjectRecord, /* TODO: this import oughtn't be necessary */
} from '../../schema/schema';

import { ObjectSuggestion, OutcomeSuggestion } from 'clark-entity';

export type suggestMode = 'text' | 'regex';
export class SuggestionInteractor {
    /**
        * Search for outcomes related to a given text string.
        *
        * FIXME: We may want to transform this into a streaming algorithm,
        *       rather than waiting for schema -> entity conversion
        *       for the entire list. I don't know if there's a good way
        *       to do that, but the terms 'Buffer' and 'Readable' seem
        *       vaguely promising.
        *
        * @param {string} text the words to search for
        * @param {suggestMode} mode which suggestion mode to use:
        *      'text' - uses mongo's native text search query
        *      'regex' - matches outcomes containing each word in text
        * @param {number} threshold minimum score to include in results
        *      (ignored if mode is 'regex')
        *
        * @returns {Outcome[]} list of outcome suggestions, ordered by score
        */
    suggestOutcomes = async function (text: string, mode: suggestMode = 'text', threshold = 0): Promise<OutcomeSuggestion[]> {
        try {
            let suggestions: OutcomeSuggestion[] = [];

            let cursor;
            switch (mode) {
                case 'text':
                    cursor = this.db.searchOutcomes(text)
                        .sort({ score: { $meta: 'textScore' } });
                    break;
                case 'regex': cursor = this.db.matchOutcomes(text); break;
                default: return assertNever(mode);
            }

            while (await cursor.hasNext()) {
                let doc = await cursor.next();
                let suggestion = {
                    id: doc._id,
                    author: doc.author,
                    name: doc.name_,
                    date: doc.date,
                    outcome: doc.outcome,
                };

                // if mode provides scoring information
                if (doc['score'] !== undefined) {
                    let score = doc['score'];

                    // skip record if score is lower than threshold
                    if (score < threshold) break;

                    /*
                     * TODO: Look into sorting options. An streaming insert
                     *       sort here may be better than mongo's,
                     *       if such a thing is possible
                     * In that case, switch break above to continue.
                     */

                }

                suggestions.push(suggestion);
            }

            return Promise.resolve(suggestions);
        } catch (e) {
            return Promise.reject(e);
        }
    };

    /**
     * Search for objects by name, author, length, level, and content.
     * FIXME: implementation is rough and probably not as efficient as it could be
     *
     * @param {string} name the objects' names should closely relate
     * @param {string} author the objects' authors' names` should closely relate
     * @param {string} length the objects' lengths should match exactly
     * @param {string} level the objects' levels should match exactly TODO: implement
     * @param {string} content the objects' outcomes' outcomes should closely relate
     *
     * @returns {Outcome[]} list of outcome suggestions, ordered by score
     */
    suggestObjects = async function (
        name: string,
        author: string,
        length: string,
        level: string,
        content: string,
    ): Promise<ObjectSuggestion[]> {
        try {
            let objects: LearningObjectRecord[] = await this.db.searchObjects(name, author, length, level, content);
            let suggestions: ObjectSuggestion[] = [];
            for (let object of objects) {
                let owner = await this.db.fetchUser(object.author);
                suggestions.push({
                    id: object._id,
                    author: owner.name_,
                    length: object.length_,
                    name: object.name_,
                    date: object.date,
                });
            }
            return Promise.resolve(suggestions);
        } catch (e) {
            return Promise.reject(e);
        }
    };
}

}