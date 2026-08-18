<?php

namespace App\Http\Controllers;

use App\Models\Hero;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class HeroController extends Controller
{
    public function index(): JsonResponse
    {
        $heroes = Hero::query()
            ->with('slides')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($heroes);
    }

    public function publicHero(): JsonResponse
    {
        $hero = Hero::query()
            ->with('slides')
            ->latest('id')
            ->first();

        return response()->json($hero);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'title_font_size' => ['nullable', 'integer', 'min:20', 'max:220'],
            'title_font_family' => ['nullable', 'string', 'max:100'],
            'description_font_size' => ['nullable', 'integer', 'min:10', 'max:100'],
            'description_font_family' => ['nullable', 'string', 'max:100'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:4096'],
            'video' => ['nullable', 'file', 'mimes:mp4,mov,avi,webm', 'max:15360'],
            'ticker_text' => ['nullable', 'string', 'max:255'],
            'sub_title' => ['nullable', 'string', 'max:255'],
            'button_enabled' => ['nullable', 'boolean'],
            'button_text' => ['nullable', 'string', 'max:255'],
            'slides' => ['nullable', 'array'],
            'slides.*' => ['image', 'mimes:jpeg,png,jpg,gif,webp', 'max:4096'],
            'slide_orders' => ['nullable', 'array'],
            'slide_orders.*' => ['integer', 'min:0'],
        ]);

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imageDirectory = public_path('uploads/heroes/images/');
            File::ensureDirectoryExists($imageDirectory);
            $imageName = time() . '_image.' . $image->getClientOriginalExtension();
            $image->move($imageDirectory, $imageName);
            $validated['image'] = 'uploads/heroes/images/' . $imageName;
        }

        if ($request->hasFile('video')) {
            $video = $request->file('video');
            $videoDirectory = public_path('uploads/heroes/videos/');
            File::ensureDirectoryExists($videoDirectory);
            $videoName = time() . '_video.' . $video->getClientOriginalExtension();
            $video->move($videoDirectory, $videoName);
            $validated['video'] = 'uploads/heroes/videos/' . $videoName;
        }

        $validated['button_enabled'] = $request->boolean('button_enabled', true);

        $hero = Hero::create($this->filterHeroPayload($validated));

        $this->syncSlides($hero, $request);

        return response()->json($hero->fresh('slides'), 201);
    }

    public function show(Hero $hero): JsonResponse
    {
        return response()->json($hero->load('slides'));
    }

    public function update(Request $request, Hero $hero): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'title_font_size' => ['nullable', 'integer', 'min:20', 'max:220'],
            'title_font_family' => ['nullable', 'string', 'max:100'],
            'description_font_size' => ['nullable', 'integer', 'min:10', 'max:100'],
            'description_font_family' => ['nullable', 'string', 'max:100'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:4096'],
            'video' => ['nullable', 'file', 'mimes:mp4,mov,avi,webm', 'max:15360'],
            'ticker_text' => ['nullable', 'string', 'max:255'],
            'sub_title' => ['nullable', 'string', 'max:255'],
            'button_enabled' => ['nullable', 'boolean'],
            'button_text' => ['nullable', 'string', 'max:255'],
            'slides' => ['nullable', 'array'],
            'slides.*' => ['image', 'mimes:jpeg,png,jpg,gif,webp', 'max:4096'],
            'slide_orders' => ['nullable', 'array'],
            'slide_orders.*' => ['integer', 'min:0'],
            'existing_slide_ids' => ['nullable', 'array'],
            'existing_slide_ids.*' => ['integer'],
        ]);

        if ($request->hasFile('image')) {
            $this->deleteFileIfExists($hero->image);

            $image = $request->file('image');
            $imageDirectory = public_path('uploads/heroes/images/');
            File::ensureDirectoryExists($imageDirectory);
            $imageName = time() . '_image.' . $image->getClientOriginalExtension();
            $image->move($imageDirectory, $imageName);
            $validated['image'] = 'uploads/heroes/images/' . $imageName;
        }

        if ($request->hasFile('video')) {
            $this->deleteFileIfExists($hero->video);

            $video = $request->file('video');
            $videoDirectory = public_path('uploads/heroes/videos/');
            File::ensureDirectoryExists($videoDirectory);
            $videoName = time() . '_video.' . $video->getClientOriginalExtension();
            $video->move($videoDirectory, $videoName);
            $validated['video'] = 'uploads/heroes/videos/' . $videoName;
        }

        if ($request->has('button_enabled')) {
            $validated['button_enabled'] = $request->boolean('button_enabled');
        }

        $hero->update($this->filterHeroPayload($validated));

        $this->syncSlides($hero, $request);

        return response()->json($hero->fresh('slides'));
    }

    public function destroy(Hero $hero): JsonResponse
    {
        $this->deleteFileIfExists($hero->image);
        $this->deleteFileIfExists($hero->video);

        $hero->load('slides');
        foreach ($hero->slides as $slide) {
            $this->deleteFileIfExists($slide->image);
        }

        $hero->delete();

        return response()->json(null, 204);
    }

    private function filterHeroPayload(array $payload): array
    {
        unset($payload['slides'], $payload['slide_orders'], $payload['existing_slide_ids']);

        return $payload;
    }

    private function syncSlides(Hero $hero, Request $request): void
    {
        if ($request->has('existing_slide_ids')) {
            $keptIds = collect($request->input('existing_slide_ids', []))
                ->map(fn ($value) => (int) $value)
                ->filter(fn ($value) => $value > 0)
                ->values();

            $hero->slides
                ->whereNotIn('id', $keptIds)
                ->each(function ($slide) {
                    $this->deleteFileIfExists($slide->image);
                    $slide->delete();
                });
        }

        $newSlides = $request->file('slides', []);
        $newSlideOrders = $request->input('slide_orders', []);

        foreach ($newSlides as $index => $slideFile) {
            if (!$slideFile) {
                continue;
            }

            $directory = public_path('uploads/heroes/slides/');
            File::ensureDirectoryExists($directory);

            $fileName = time() . '_' . $index . '_slide.' . $slideFile->getClientOriginalExtension();
            $slideFile->move($directory, $fileName);

            $hero->slides()->create([
                'image' => 'uploads/heroes/slides/' . $fileName,
                'sort_order' => (int) ($newSlideOrders[$index] ?? ($index + 1)),
            ]);
        }

        if ($request->has('existing_slide_orders')) {
            $existingOrders = $request->input('existing_slide_orders', []);

            foreach ($existingOrders as $slideId => $order) {
                $slide = $hero->slides()->whereKey((int) $slideId)->first();
                if ($slide) {
                    $slide->update([
                        'sort_order' => (int) $order,
                    ]);
                }
            }
        }
    }

    private function deleteFileIfExists(?string $relativePath): void
    {
        if (blank($relativePath)) {
            return;
        }

        $absolutePath = public_path($relativePath);
        if (file_exists($absolutePath)) {
            unlink($absolutePath);
        }
    }
}
