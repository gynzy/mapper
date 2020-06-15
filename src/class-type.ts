/**
 * Type of model to be used as parameter.
 */
export type ClassType<T> = new (...args: unknown[]) => T;
