<?php

namespace App\Http\Controllers;


use App\Models\ShpByProduct;
use App\Models\ShpByProductItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class ShopByProductController extends Controller
{
    public function publicShow(): JsonResponse
    {
        return $this->sectionResponse();
    }

    public function show(): JsonResponse
    {
        return $this->sectionResponse();
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
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:4096'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('shop_by_product_items', 'public');
        }

        $section = $this->resolveSection();
        $item = $section->items()->create([
            'title' => $validated['title'] ?? '',
            'image' => $validated['image'] ?? null,
            'sort_order' => (int) ($validated['sort_order'] ?? ($section->items()->max('sort_order') + 1)),
        ]);

        return response()->json($item->fresh(), 201);
    }

    public function updateItem(Request $request, ShpByProductItem $item): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:4096'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        if ($request->hasFile('image')) {
            if ($item->image) {
               $this->deleteImageIfExists($item->image);
            }

            $validated['image'] = $request->file('image')->store('shop_by_product_items', 'public');
        }

        $item->update($validated);

        return response()->json($item->fresh());
    }

    public function destroyItem(ShpByProductItem $item): JsonResponse
    {
        if ($item->image) {
            $this->deleteImageIfExists($item->image);
        }
        $item->delete();

        return response()->json($item);
    }

    private function sectionResponse(): JsonResponse
    {
        $section = $this->resolveSection()->load('items');

        return response()->json([
            'id' => $section->id,
            'title' => $section->title,
            'subtitle' => $section->subtitle,
            'items' => $section->items,
        ]);
    }

    private function resolveSection(): ShpByProduct
    {
        return ShpByProduct::query()->firstOrCreate([], [
            'title' => '',
            'subtitle' => '',
        ]);
    }

    private function deleteImageIfExists($imagePath): void
    {
        $fullPath = public_path('storage/' . $imagePath);
        if (File::exists($fullPath)) {
            File::delete($fullPath);
        }
    }
}
