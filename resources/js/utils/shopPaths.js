/** Shop page URL filtered to a category, optionally narrowed to a sub-category and grandchild. */
export function categoryShopPath(category, subCategory, grandChild) {
    const params = new URLSearchParams({ category: category.slug });
    if (subCategory) params.set('subcategory', subCategory.slug);
    if (grandChild) params.set('grandchild', grandChild.slug);
    return `/shop?${params.toString()}`;
}
