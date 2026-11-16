import { useEffect, useSyncExternalStore } from 'react';

import { accountApi } from '../api/accountApi';

// One auth store shared by every storefront component (header, auth pages, account pages, checkout).
let state = { status: 'idle', user: null }; // status: idle | loading | ready
let sessionRequest = null;
const listeners = new Set();

function setState(next) {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
}

function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot() {
    return state;
}

export function loadSession({ force = false } = {}) {
    if (sessionRequest && !force) return sessionRequest;

    if (state.status === 'idle') setState({ status: 'loading' });

    sessionRequest = accountApi
        .session()
        .then((payload) => {
            setState({ status: 'ready', user: payload?.user || null });
            return payload?.user || null;
        })
        .catch(() => {
            // Treat as logged out, but allow a retry on the next mount.
            sessionRequest = null;
            setState({ status: 'ready', user: null });
            return null;
        });

    return sessionRequest;
}

/** Store the user returned by login / register / profile updates. */
export function setAuthUser(user) {
    sessionRequest = Promise.resolve(user || null);
    setState({ status: 'ready', user: user || null });
}

export async function logout() {
    try {
        await accountApi.logout();
    } finally {
        setAuthUser(null);
    }
}

/**
 * `{ user, isLoading, isAuthenticated }` for the storefront session.
 * `isLoading` stays true until the first session check finishes.
 */
export default function useAuth() {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    useEffect(() => {
        if (snapshot.status === 'idle') loadSession();
    }, [snapshot.status]);

    return {
        user: snapshot.user,
        isLoading: snapshot.status !== 'ready',
        isAuthenticated: Boolean(snapshot.user),
    };
}
