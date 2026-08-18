import { useEffect, useState } from 'react';

let sectionsRequest;

function fetchSections() {
    if (!sectionsRequest) {
        sectionsRequest = fetch('/api/public/about-page', {
            headers: { Accept: 'application/json' },
        }).then((response) => {
            if (!response.ok) throw new Error('Failed to load About page.');
            return response.json();
        });
    }

    return sectionsRequest;
}

export function useAboutPageSection(sectionKey, fallback) {
    const [section, setSection] = useState(fallback);

    useEffect(() => {
        let ignore = false;

        fetchSections()
            .then((records) => {
                const record = (Array.isArray(records) ? records : []).find(
                    (item) => item.section_key === sectionKey
                );

                if (!ignore && record) {
                    const imageUrl = record.image_url
                        ? `${record.image_url}?v=${encodeURIComponent(record.updated_at || '')}`
                        : null;
                    setSection({ ...record, image_url: imageUrl });
                }
            })
            .catch(() => {});

        return () => {
            ignore = true;
        };
    }, [sectionKey]);

    return section;
}