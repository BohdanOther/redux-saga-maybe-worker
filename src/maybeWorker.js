import { is } from 'redux-saga/utils';
import { put, call } from 'redux-saga/effects';

import {
    assert,
    pipe,
    makeEffect,
    makeMapper,
    identity,
    noop
} from './utils';
/**
 * Abstraction over effect which may throw when yielded
 * Inspired by Maybe monad
 * TODO: allow use fetch, spawn runner effect
 */
class MaybeWorker {
    constructor(maybeEffect) {
        this.maybeEffect = maybeEffect;
        this.someWorker = noop;
        this.noneWorker = noop;
    }

    /**
     * Perform action if Maybe returned Some result
     * You can pass a function, generator or saga effect
     */
    some(worker) {
        this.someWorker = makeEffect(worker);
        return this;
    }

    /**
     * Perform action if Maybe returned None result
     * You can pass a function, generator or saga effect
     */
    none(worker) {
        this.noneWorker = makeEffect(worker);
        return this;
    }

    /**
     * Bind redux saga routine.
     * Will call routine.success if Maybe has some value
     * of routine.failure if Maybe has None value.
     */
    bind(routine) {
        if (process.env.NODE_ENV !== 'production') {
            assert(
                ['request', 'success', 'failure', 'fulfill'].every(t => is.func(routine[t])),
                'Expected a valid redux saga routine'
            );
        }

        this.routine = routine;
        this.successMapper = this.successMapper || identity;
        this.failureMapper = this.failureMapper || identity;
        return this;
    }

    /**
     * Provide some value mapper which will be passed to routine.success
     * @param {any} map mapping function which acceps Some argument or any value
     */
    mapSuccess(map) {
        this.successMapper = makeMapper(map);
        return this;
    }

    /**
     * Provide none value mapper which will be passed to routine.failure
     * @param {any} map mapping function which acceps None argument or any value
     */
    mapFailure(map) {
        this.failureMapper = makeMapper(map);
        return this;
    }

    /**
     * Returns create redux saga call effect
     */
    run() {
        const dispatchRoutines = !!this.routine;

        const runner = function* () {
            if (dispatchRoutines) {
                yield put(this.routine.request());
            }

            try {
                const some = yield this.maybeEffect;

                if (dispatchRoutines) {
                    yield pipe(
                        this.successMapper,
                        this.routine.success,
                        put
                    )(some);
                }

                yield this.someWorker(some);

                return { some };
            } catch (error) {
                if (process.env.NODE_ENV === 'production') {
                    console.error(error, error.message); // eslint-disable-line
                }

                if (dispatchRoutines) {
                    yield pipe(
                        this.failureMapper,
                        this.routine.failure,
                        put
                    )(error);
                }

                yield this.noneWorker(error);

                return { none: error };
            } finally {
                if (dispatchRoutines) {
                    yield put(this.routine.fulfill());
                }
            }
        };

        return call([this, runner]);
    }
}

export default MaybeWorker;
