<?php

namespace App\Http\Controllers;

use App\Models\HowWeHelpItem;
use App\Models\HowWeHelpSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class HowWeHelpController extends Controller
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
            'description' => ['nullable', 'string'],
        ]);

        $section = $this->resolveSection();
        $section->update([
            'title' => $validated['title'] ?? '',
            'description' => $validated['description'] ?? '',
        ]);

        return response()->json($section->fresh());
    }

    public function storeItem(Request $request): JsonResponse
    {
        $validated = $this->validateItem($request);
        $section = $this->resolveSection();

        if ($request->hasFile('image')) {
            $validated['image'] = $this->storeImage($request->file('image'));
        }

        $item = $section->items()->create([
            'title' => $validated['title'] ?? '',
            'description' => $validated['description'] ?? '',
            'image' => $validated['image'] ?? null,
            'sort_order' => (int) ($validated['sort_order'] ?? ($section->items()->max('sort_order') + 1)),
        ]);

        return response()->json($item->fresh(), 201);
    }

    public function updateItem(Request $request, HowWeHelpItem $item): JsonResponse
    {
        $validated = $this->validateItem($request);

        if ($request->hasFile('image')) {
            if ($item->image) {
                $this->deleteImageIfExists($item->image);
            }

            $validated['image'] = $this->storeImage($request->file('image'));
        }

        $item->update([
            'title' => $validated['title'] ?? $item->title,
            'description' => $validated['description'] ?? $item->description,
            'image' => $validated['image'] ?? $item->image,
            'sort_order' => (int) ($validated['sort_order'] ?? $item->sort_order),
        ]);

        return response()->json($item->fresh());
    }

    public function destroyItem(HowWeHelpItem $item): JsonResponse
    {
        if ($item->image) {
            $this->deleteImageIfExists($item->image);
        }

        $item->delete();

        return response()->json(['message' => 'Item deleted']);
    }

    private function sectionResponse(): JsonResponse
    {
        $section = $this->resolveSection()->load('items');

        return response()->json([
            'id' => $section->id,
            'title' => $section->title,
            'description' => $section->description,
            'items' => $section->items,
        ]);
    }

    private function resolveSection(): HowWeHelpSection
    {
        return HowWeHelpSection::query()->firstOrCreate([], [
            'title' => '',
            'description' => '',
        ]);
    }

    private function validateItem(Request $request): array
    {
        return $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:4096'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);
    }

    private function storeImage($image): string
    {
        $directory = public_path('uploads/how-we-help/');
        File::ensureDirectoryExists($directory);

        $name = time() . '_' . uniqid('help_', true) . '.' . $image->getClientOriginalExtension();
        $image->move($directory, $name);

        return 'uploads/how-we-help/' . $name;
    }

    private function deleteImageIfExists(string $imagePath): void
    {
        $absolute = public_path($imagePath);
        if (file_exists($absolute)) {
            unlink($absolute);
        }
    }
}