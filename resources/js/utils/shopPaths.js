/** Shop page URL filtered to a category, optionally narrowed to a sub-category and grandchild. */
export function categoryShopPath(category, subCategory, grandChild) {
    const slugs = [category, subCategory, grandChild]
        .filter(Boolean)
        .map((item) => encodeURIComponent(item.slug));
    return slugs.length ? `/shop/${slugs.join('/')}` : '/shop';
}
