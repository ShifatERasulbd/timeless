import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loads account data with `loader()` and re-runs it when `deps` change.
 * Returns `{ data, setData, error, isLoading, reload }`; stale responses are ignored.
 */
export default function useAccountResource(loader, deps = []) {
    const [state, setState] = useState({ data: null, error: null, isLoading: true });
    const requestId = useRef(0);
    // `deps` decide when the loader is re-run (like useEffect deps).
    const load = useCallback(loader, deps);

    const reload = useCallback(() => {
        const id = ++requestId.current;
        setState((previous) => ({ ...previous, error: null, isLoading: true }));

        return load()
            .then((data) => {
                if (id === requestId.current) setState({ data, error: null, isLoading: false });
                return data;
            })
            .catch((error) => {
                if (id === requestId.current) setState((previous) => ({ ...previous, error, isLoading: false }));
            });
    }, [load]);

    useEffect(() => {
        reload();
        return () => {
            // Invalidate in-flight requests when deps change or the component unmounts.
            requestId.current += 1;
        };
    }, [reload]);

    const setData = useCallback((updater) => {
        setState((previous) => ({
            ...previous,
            data: typeof updater === 'function' ? updater(previous.data) : updater,
        }));
    }, []);

    return { ...state, setData, reload };
}
