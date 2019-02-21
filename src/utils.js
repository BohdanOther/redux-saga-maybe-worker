export const noop = () => { };

export const identity = t => t;

export const pipe = (...fns) => fns.reduce((f, g) => x => g(f(x)));

export const makeEffect = fn => payload => is.func(fn) ? call(fn, payload) : fn;

export const makeMapper = map => is.func(map) ? map : () => map;

export function assert(condition, message) {
    if (__DEV__) {
        if (!condition) {
            console.error('Assertion failed', message); // eslint-disable-line
            throw new Error(`Assertion error: ${message}`);
        }
    }
}
