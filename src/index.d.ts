/**
 * Expose additional prototype functions for the native Set interface.
 */
interface Set<T> {
    difference(by: Set<T>): Set<T>;
    equals(to: Set<T>): boolean;
}