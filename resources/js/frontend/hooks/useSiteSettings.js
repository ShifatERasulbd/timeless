import { useEffect, useState } from 'react';

let settingsRequest;

// Shared across components so the settings are only fetched once per page load.
function fetchSiteSettings() {
    if (!settingsRequest) {
        settingsRequest = fetch('/api/public/settings', {
            headers: { Accept: 'application/json' },
        })
            .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Failed to load settings.'))))
            .then((data) => (data?.payload && typeof data.payload === 'object' ? data.payload : {}))
            .catch((error) => {
                // Allow a retry on the next mount instead of caching the failure.
                settingsRequest = undefined;
                throw error;
            });
    }

    return settingsRequest;
}

/**
 * Site settings from the admin Settings module (logos, contact details, social links…).
 * `isLoaded` turns true once the request settles, even if it failed, so callers can show fallbacks.
 */
export default function useSiteSettings() {
    const [state, setState] = useState({ settings: {}, isLoaded: false });

    useEffect(() => {
        let ignore = false;

        fetchSiteSettings()
            .then((settings) => {
                if (!ignore) setState({ settings, isLoaded: true });
            })
            .catch(() => {
                if (!ignore) setState({ settings: {}, isLoaded: true });
            });

        return () => {
            ignore = true;
        };
    }, []);

    return state;
}
