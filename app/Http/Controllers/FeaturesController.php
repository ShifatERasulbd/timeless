<?php

namespace App\Http\Controllers;

use App\Models\Features;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class FeaturesController extends Controller
{
    private function toResponseArray(Features $feature): array
    {
        $data = $feature->toArray();
        $data['icon_url'] = $feature->icon ? url('/' . ltrim($feature->icon, '/')) : null;

        return $data;
    }

    public function index(): JsonResponse
    {
        $features = Features::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (Features $feature) => $this->toResponseArray($feature));

        return response()->json($features);
    }

    public function publicIndex(): JsonResponse
    {
        $features = Features::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (Features $feature) => $this->toResponseArray($feature));

        return response()->json($features);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'icon' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:1024'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        if (!array_key_exists('sort_order', $validated) || $validated['sort_order'] === null) {
            $maxOrder = (int) Features::query()->max('sort_order');
            $validated['sort_order'] = $maxOrder + 1;
        }

        if ($request->hasFile('icon')) {
            $icon = $request->file('icon');
            $iconDirectory = public_path('uploads/features/icons/');
            File::ensureDirectoryExists($iconDirectory);
            $iconName = time() . '_' . uniqid('icon_', true) . '.' . $icon->getClientOriginalExtension();
            $icon->move($iconDirectory, $iconName);
            $validated['icon'] = 'uploads/features/icons/' . $iconName;
        }

        $feature = Features::query()->create($validated);

        return response()->json($this->toResponseArray($feature), 201);
    }

    public function show(Features $feature): JsonResponse
    {
        return response()->json($this->toResponseArray($feature));
    }

    public function update(Request $request, Features $feature): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'icon' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:1024'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        if ($request->hasFile('icon')) {
            if ($feature->icon) {
                $this->deleteIconIfExists($feature->icon);
            }

            $icon = $request->file('icon');
            $iconDirectory = public_path('uploads/features/icons/');
            File::ensureDirectoryExists($iconDirectory);
            $iconName = time() . '_' . uniqid('icon_', true) . '.' . $icon->getClientOriginalExtension();
            $icon->move($iconDirectory, $iconName);
            $validated['icon'] = 'uploads/features/icons/' . $iconName;
        }

        $feature->update($validated);

        return response()->json($this->toResponseArray($feature->fresh()));
    }

    public function destroy(Features $feature): JsonResponse
    {
        if ($feature->icon) {
            $this->deleteIconIfExists($feature->icon);
        }

        $feature->delete();

        return response()->json(['message' => 'Feature deleted']);
    }

    private function deleteIconIfExists(string $iconPath): void
    {
        $absolutePath = public_path($iconPath);

        if (file_exists($absolutePath)) {
            unlink($absolutePath);
        }
    }
}
