<?php

namespace App\Http\Controllers;

use App\Models\ShopByIndustryItem;
use App\Models\ShopByIndustrySection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class ShopByIndustryController extends Controller
{
    public function publicShow(): JsonResponse
    {
        $section = $this->resolveSection()->load('items.category:id,name,slug');

        return response()->json([
            'id' => $section->id,
            'title' => $section->title,
            'subtitle' => $section->subtitle,
            'items' => $section->items,
        ]);
    }

    public function show(): JsonResponse
    {
        $section = $this->resolveSection()->load('items.category:id,name,slug');

        return response()->json([
            'id' => $section->id,
            'title' => $section->title,
            'subtitle' => $section->subtitle,
            'items' => $section->items,
        ]);
    }

    public function updateSection(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string'],
        ]);

        $section = $this->resolveSection();
        $section->update([
            'title' => $validated['title'] ?? '',
            'subtitle' => $validated['subtitle'] ?? '',
        ]);

        return response()->json($section->fresh());
    }

    public function storeItem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:4096'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $section = $this->resolveSection();

        if ($request->hasFile('image')) {
            $validated['image'] = $this->storeImage($request->file('image'));
        }

        $item = $section->items()->create([
            'title' => $validated['title'] ?? '',
            'category_id' => $validated['category_id'] ?? null,
            'image' => $validated['image'] ?? null,
            'sort_order' => (int) ($validated['sort_order'] ?? ($section->items()->max('sort_order') + 1)),
        ]);

        return response()->json($item->fresh('category:id,name,slug'), 201);
    }

    public function updateItem(Request $request, ShopByIndustryItem $item): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:4096'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        if ($request->hasFile('image')) {
            if ($item->image) {
                $this->deleteImageIfExists($item->image);
            }

            $validated['image'] = $this->storeImage($request->file('image'));
        }

        $item->update([
            'title' => $validated['title'] ?? $item->title,
            // Only touch the category when the request sends it, so an empty value clears it.
            'category_id' => array_key_exists('category_id', $validated) ? $validated['category_id'] : $item->category_id,
            'image' => $validated['image'] ?? $item->image,
            'sort_order' => (int) ($validated['sort_order'] ?? $item->sort_order),
        ]);

        return response()->json($item->fresh('category:id,name,slug'));
    }

    public function destroyItem(ShopByIndustryItem $item): JsonResponse
    {
        if ($item->image) {
            $this->deleteImageIfExists($item->image);
        }

        $item->delete();

        return response()->json(['message' => 'Item deleted']);
    }

    private function resolveSection(): ShopByIndustrySection
    {
        return ShopByIndustrySection::query()->firstOrCreate([], [
            'title' => '',
            'subtitle' => '',
        ]);
    }

    private function storeImage($image): string
    {
        $directory = public_path('uploads/shop-by-industry/');
        File::ensureDirectoryExists($directory);

        $name = time() . '_' . uniqid('industry_', true) . '.' . $image->getClientOriginalExtension();
        $image->move($directory, $name);

        return 'uploads/shop-by-industry/' . $name;
    }

    private function deleteImageIfExists(string $imagePath): void
    {
        $absolute = public_path($imagePath);
        if (file_exists($absolute)) {
            unlink($absolute);
        }
    }
}
