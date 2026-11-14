<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;

class ImageUploadOptimizer
{
    /**
     * Resize an uploaded image to fit within the given bounds and store it as WebP.
     * Falls back to storing the original file untouched if GD/WebP support is unavailable.
     */
    public function storeAsWebp(
        UploadedFile $file,
        string $relativeDirectory,
        string $filenamePrefix = '',
        int $maxWidth = 1600,
        int $maxHeight = 1600,
        int $quality = 80
    ): string {
        $relativeDirectory = trim($relativeDirectory, '/');
        $directory = public_path($relativeDirectory);

        if (! File::exists($directory)) {
            File::makeDirectory($directory, 0755, true);
        }

        $filename = $filenamePrefix . now()->format('YmdHis') . '-' . bin2hex(random_bytes(5));

        $encoded = $this->encodeAsWebp($file, $maxWidth, $maxHeight, $quality);

        if ($encoded !== null) {
            $webpFilename = $filename . '.webp';
            File::put($directory . DIRECTORY_SEPARATOR . $webpFilename, $encoded);

            return '/' . $relativeDirectory . '/' . $webpFilename;
        }

        $extension = strtolower((string) $file->getClientOriginalExtension()) ?: 'img';
        $fallbackFilename = $filename . '.' . $extension;
        $file->move($directory, $fallbackFilename);

        return '/' . $relativeDirectory . '/' . $fallbackFilename;
    }

    private function encodeAsWebp(UploadedFile $file, int $maxWidth, int $maxHeight, int $quality): ?string
    {
        if (! function_exists('imagewebp') || ! function_exists('getimagesize')) {
            return null;
        }

        $imageInfo = @getimagesize($file->getRealPath());
        if (! $imageInfo) {
            return null;
        }

        [$width, $height, $type] = $imageInfo;

        $source = match ($type) {
            IMAGETYPE_JPEG => function_exists('imagecreatefromjpeg') ? @imagecreatefromjpeg($file->getRealPath()) : false,
            IMAGETYPE_PNG => function_exists('imagecreatefrompng') ? @imagecreatefrompng($file->getRealPath()) : false,
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($file->getRealPath()) : false,
            IMAGETYPE_GIF => function_exists('imagecreatefromgif') ? @imagecreatefromgif($file->getRealPath()) : false,
            default => false,
        };

        if (! $source) {
            return null;
        }

        $scale = min(1, $maxWidth / $width, $maxHeight / $height);
        $targetWidth = max(1, (int) round($width * $scale));
        $targetHeight = max(1, (int) round($height * $scale));

        $canvas = imagecreatetruecolor($targetWidth, $targetHeight);
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
        imagefilledrectangle($canvas, 0, 0, $targetWidth, $targetHeight, $transparent);

        imagecopyresampled($canvas, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);
        imagedestroy($source);

        ob_start();
        imagewebp($canvas, null, $quality);
        $data = ob_get_clean();
        imagedestroy($canvas);

        return $data ?: null;
    }
}
