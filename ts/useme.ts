/**
 * This script carries out static processes that should occur
 * at the start of every script and service. Thus, it should
 * be imported at the start of every script and service.
 */

import { UserSchema } from './schema/user.schema';
import { LearningOutcomeSchema } from './schema/learning-outcome.schema';
import { StandardOutcomeSchema } from './schema/standard-outcome.schema';
import { LearningObjectSchema } from './schema/learning-object.schema';

 /**
  * Just a simple expression to force javascript to declare the
  * given class, thereby triggering its decorator functions.
  * @param {Function} schema which class to decorate
  */
function decorate(schema: Function) {
    schema.name;
}

// ensure each schematic is decorated
decorate(UserSchema);
decorate(StandardOutcomeSchema);
decorate(LearningOutcomeSchema);
decorate(LearningObjectSchema);

// provide functionality for some important set arithmetic
Set.prototype.difference = function<T>(this:Set<T>, by:Set<T>): Set<T> {
    let difference = new Set<T>(this);
    if(by) for ( let elem of by ) {
        difference.delete(elem);
    }
    return difference;
}

Set.prototype.equals = function<T>(this:Set<T>, to:Set<T>): boolean {
    for ( let elem of this ) if (!to.has(elem))   return false;
    for ( let elem of to   ) if (!this.has(elem)) return false;
    return true;
}

Set.prototype.toString = function<T>(this:Set<T>): string {
    return "{"+Array.from(this).toString()+"}";
}