<?php

namespace App\Http\Controllers;

use App\Models\AboutPageSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class AboutPageSectionController extends Controller
{
    private const DEFAULTS = [
        'hero' => [
            'title' => '',
            'description' => '',
            'image' => null,
        ],
        'timeless' => [
            'title' => '',
            'description' => '',
            'image' => null,
        ],
        'story' => [
            'title' => 'Our Story',
            'description' => '<p>Timeless Fashion was built with a vision to combine quality craftsmanship with modern personalization.</p><p>From custom corporate wear to personalized everyday essentials, we create pieces that feel comfortable, meaningful, and uniquely yours.</p>',
            'image' => 'uploads/heroes/images/hero1.webp',
        ],
        'personalizer' => [
            'title' => 'Our Solution',
            'description' => '<p>Upload your logo, imprint, and graphics, and try our Product Personalizer to fine-tune placement and color for a personalized design.</p>',
            'image' => null,
        ],
        'mission' => [
            'title' => 'Our Mission',
            'description' => '<p>Our mission is to make personalized fashion accessible, premium, and expressive.</p>',
            'image' => 'uploads/heroes/images/hero1.webp',
        ],
    ];

    public function publicIndex(): JsonResponse
    {
        return response()->json($this->resolveSections());
    }

    public function index(): JsonResponse
    {
        return response()->json($this->resolveSections());
    }

    public function update(Request $request, string $sectionKey): JsonResponse
    {
        abort_unless(array_key_exists($sectionKey, self::DEFAULTS), 404);

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:4096'],
        ]);

        $section = $this->resolveSection($sectionKey);

        if ($request->hasFile('image')) {
            if ($section->image && str_starts_with($section->image, 'uploads/about-page/')) {
                File::delete(public_path($section->image));
            }

            $validated['image'] = $this->storeImage($request->file('image'), $sectionKey);
        }

        $section->update([
            'title' => $validated['title'] ?? '',
            'description' => $validated['description'] ?? '',
            'image' => $validated['image'] ?? $section->image,
        ]);

        return response()->json($section->fresh());
    }

    public function deleteImage(string $sectionKey): JsonResponse
    {
        abort_unless(array_key_exists($sectionKey, self::DEFAULTS), 404);

        $section = $this->resolveSection($sectionKey);
        if ($section->image && str_starts_with($section->image, 'uploads/about-page/')) {
            File::delete(public_path($section->image));
        }

        $section->update(['image' => null]);

        return response()->json($section->fresh());
    }

    public function destroy(string $sectionKey): JsonResponse
    {
        abort_unless(array_key_exists($sectionKey, self::DEFAULTS), 404);

        $section = AboutPageSection::query()->where('section_key', $sectionKey)->first();
        if ($section?->image && str_starts_with($section->image, 'uploads/about-page/')) {
            File::delete(public_path($section->image));
        }

        $section?->delete();

        return response()->json(['message' => 'Section deleted.']);
    }

    private function resolveSections()
    {
        return collect(array_keys(self::DEFAULTS))
            ->map(fn (string $sectionKey) => $this->resolveSection($sectionKey));
    }

    private function resolveSection(string $sectionKey): AboutPageSection
    {
        return AboutPageSection::query()->firstOrCreate(
            ['section_key' => $sectionKey],
            self::DEFAULTS[$sectionKey]
        );
    }

    private function storeImage($image, string $sectionKey): string
    {
        $directory = public_path('uploads/about-page/');
        File::ensureDirectoryExists($directory);

        $name = time() . '_' . uniqid($sectionKey . '_', true) . '.' . $image->getClientOriginalExtension();
        $image->move($directory, $name);

        return 'uploads/about-page/' . $name;
    }
}