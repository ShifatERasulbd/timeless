/** Only follow same-site paths from ?redirect= so auth pages can't be used as an open redirect. */
export function safeRedirectPath(value, fallback = '/account') {
    return typeof value === 'string' && /^\/(?![/\\])/.test(value) ? value : fallback;
}
