import MaybeWorker from './maybeWorker';

function request(api, ...args) {
    const callEffect = call(api, ...args);
    return new MaybeWorker(callEffect);
}

export {
    MaybeWorker,
    request,
};
