<?php

namespace App\Http\Controllers;
use App\Models\customizeHomePage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Http\JsonResponse;

class CustomizeHomeController extends Controller
{
    public function publicShow(): JsonResponse
    {
        $section = customizeHomePage::first();

        return response()->json($section);
    }

    public function show(): JsonResponse
    {
        $section = customizeHomePage::first();

        return response()->json($section);
    }

    public function updateSection(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:4096'],
        ]);

        $section = customizeHomePage::first();

        if ($request->hasFile('image')) {
            if ($section && $section->image) {
                $this->deleteImageFile($section->image);
            }

            $validated['image'] = $this->storeImage($request->file('image'));
        }

        if ($section) {
            $section->update([
                'title' => $validated['title'] ?? '',
                'description' => $validated['description'] ?? '',
                'image' => $validated['image'] ?? $section->image,
            ]);
        } else {
            $section = customizeHomePage::create([
                'title' => $validated['title'] ?? '',
                'description' => $validated['description'] ?? '',
                'image' => $validated['image'] ?? null,
            ]);
        }

        return response()->json($section->fresh());
    }

    public function deleteImage(): JsonResponse
    {
        $section = customizeHomePage::first();

        if (!$section) {
            return response()->json(null);
        }

        if ($section->image) {
            $this->deleteImageFile($section->image);
            $section->update(['image' => null]);
        }

        return response()->json($section->fresh());
    }

    private function storeImage($image): string
    {
        $directory = public_path('uploads/customize-home/');
        File::ensureDirectoryExists($directory);

        $name = time() . '_' . uniqid('customizer_', true) . '.' . $image->getClientOriginalExtension();
        $image->move($directory, $name);

        return 'uploads/customize-home/' . $name;
    }

    private function deleteImageFile(string $imagePath): void
    {
        $path = str_starts_with($imagePath, 'uploads/')
            ? public_path($imagePath)
            : storage_path('app/public/' . ltrim($imagePath, '/'));

        File::delete($path);
    }
}
