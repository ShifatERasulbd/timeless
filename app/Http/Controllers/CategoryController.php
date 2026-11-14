<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    
    public function index():JsonResponse
    {
        $categories = Category::query()->orderBy('id')->get();

        return response()->json($categories);
    }

    /**
     * Storefront navigation: every category with its sub-categories (names + slugs only).
     */
    public function publicIndex(): JsonResponse
    {
        $categories = Category::query()
            ->with([
                'subCategories' => fn ($query) => $query->select('id', 'name', 'slug', 'category_id')->orderBy('id'),
                // Same order as the drag-and-drop list in the GrandChild admin.
                'subCategories.grandChilds' => fn ($query) => $query
                    ->select('id', 'name', 'slug', 'sub_category_id')
                    ->orderBy('position')
                    ->orderBy('id'),
            ])
            ->orderBy('id')
            ->get(['id', 'name', 'slug'])
            ->map(fn (Category $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'sub_categories' => $category->subCategories
                    ->map(fn ($subCategory): array => [
                        'id' => $subCategory->id,
                        'name' => $subCategory->name,
                        'slug' => $subCategory->slug,
                        'grand_childs' => $subCategory->grandChilds
                            ->map(fn ($grandChild): array => [
                                'id' => $grandChild->id,
                                'name' => $grandChild->name,
                                'slug' => $grandChild->slug,
                            ])
                            ->values(),
                    ])
                    ->values(),
            ]);

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $validated =$request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:categories,slug'],
            'show_homepage' => ['nullable', 'boolean'],
        ]);
        $validated['show_homepage'] = $request->boolean('show_homepage');
        $category =Category::query()->create($validated);
        return response()->json($category,201);
    }

    public function show (Category $category): JsonResponse
    {
        return response()->json($category);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $validated =$request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:categories,slug,' . $category->id],
            'show_homepage' => ['nullable', 'boolean'],
        ]);
        $validated['show_homepage'] = $request->boolean('show_homepage');
        $category->update($validated);
        return response()->json($category);
    }

    public function destroy(Category $category): JsonResponse
    {
        $category->delete();
        return response()->json(null,204);
    }
}
  