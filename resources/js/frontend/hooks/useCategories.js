import { useEffect, useState } from 'react';

let categoriesRequest;

// Shared across components so the categories are only fetched once per page load.
function fetchCategories() {
    if (!categoriesRequest) {
        categoriesRequest = fetch('/api/public/categories', {
            headers: { Accept: 'application/json' },
        })
            .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Failed to load categories.'))))
            .catch((error) => {
                // Allow a retry on the next mount instead of caching the failure.
                categoriesRequest = undefined;
                throw error;
            });
    }

    return categoriesRequest;
}

/** Categories (each with `sub_categories`) for storefront navigation. */
export default function useCategories() {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        let ignore = false;

        fetchCategories()
            .then((payload) => {
                if (!ignore) setCategories(Array.isArray(payload) ? payload : []);
            })
            .catch(() => {});

        return () => {
            ignore = true;
        };
    }, []);

    return categories;
}
