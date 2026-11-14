import { useLayoutEffect } from 'react';

/**
 * Wraps every visible character inside `root` in its own span (with `charClassName`), leaving
 * whitespace as plain text so line wrapping behaves exactly as before.
 */
function wrapCharacters(root, charClassName) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    const chars = [];
    textNodes.forEach((node) => {
        if (!node.nodeValue.trim()) return;

        const fragment = document.createDocumentFragment();
        for (const char of node.nodeValue) {
            if (/\s/.test(char)) {
                fragment.appendChild(document.createTextNode(char));
                continue;
            }
            const span = document.createElement('span');
            span.className = charClassName;
            span.textContent = char;
            fragment.appendChild(span);
            chars.push(span);
        }
        node.parentNode.replaceChild(fragment, node);
    });

    return chars;
}

/**
 * Scroll-linked text reveal: as the element at `textRef` scrolls up through the viewport, its
 * characters get `is-revealed` one by one (and lose it again when scrolling back up). Style the
 * two states with CSS on `charClassName`.
 *
 * `html` is the markup rendered into the element via dangerouslySetInnerHTML; it's used to know
 * when to re-wrap and to restore the original markup on cleanup.
 *
 * The reveal starts when the text's top reaches `start` (fraction of viewport height from the
 * top) and finishes when its bottom reaches `end`.
 */
export function useScrollRevealText(textRef, html, { charClassName = 'scroll-reveal-char', start = 0.85, end = 0.4 } = {}) {
    useLayoutEffect(() => {
        const text = textRef.current;
        if (!text || !html) return undefined;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

        const chars = wrapCharacters(text, charClassName);
        let revealedCount = 0;
        let frame = 0;

        function update() {
            frame = 0;
            const rect = text.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const startLine = viewportHeight * start;
            const endLine = viewportHeight * end;
            const distance = Math.max(1, startLine - endLine + rect.height);
            const progress = Math.min(1, Math.max(0, (startLine - rect.top) / distance));
            const nextCount = Math.round(progress * chars.length);

            if (nextCount === revealedCount) return;
            // Only touch the characters whose state actually changed.
            const from = Math.min(nextCount, revealedCount);
            const to = Math.max(nextCount, revealedCount);
            for (let index = from; index < to; index += 1) {
                chars[index].classList.toggle('is-revealed', index < nextCount);
            }
            revealedCount = nextCount;
        }

        function requestUpdate() {
            if (!frame) frame = requestAnimationFrame(update);
        }

        update();
        window.addEventListener('scroll', requestUpdate, { passive: true });
        window.addEventListener('resize', requestUpdate);

        return () => {
            window.removeEventListener('scroll', requestUpdate);
            window.removeEventListener('resize', requestUpdate);
            if (frame) cancelAnimationFrame(frame);
            // Restore the original markup so React's dangerouslySetInnerHTML stays in sync (and a
            // StrictMode re-run doesn't wrap twice). Skip it if React already swapped in new HTML,
            // which detaches our spans.
            if (chars.length && text.contains(chars[0])) {
                text.innerHTML = html;
            }
        };
    }, [textRef, html, charClassName, start, end]);
}
