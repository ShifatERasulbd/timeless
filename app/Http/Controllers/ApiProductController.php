<?php

namespace App\Http\Controllers;

use App\Models\Color;
use App\Models\Product;
use App\Models\Size;
use App\Models\Stage;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ApiProductController extends Controller
{
    public function index(): JsonResponse
    {
        $query = Product::query()
            ->with(['category:id,name,slug', 'subCategory:id,name,slug', 'grandChild:id,name,slug'])
            ->orderBy('name');

        if (Schema::hasColumn('products', 'size')) {
            $query->orderBy('size');
        }

        if (Schema::hasColumn('products', 'color')) {
            $query->orderBy('color');
        }

        $products = $query
            ->orderBy('sku')
            ->get()
            ->map(fn (Product $product): array => $this->formatProduct($product));

        return response()->json($products);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json($this->formatProduct($product->loadMissing(['category:id,name,slug', 'subCategory:id,name,slug', 'grandChild:id,name,slug'])));
    }

    public function sync(): JsonResponse
    {
        $baseUrl    = rtrim((string) config('services.inventory.base_url'), '/');
        $apiKey     = (string) config('services.inventory.canada_api_key');
        $warehouseId = (int) config('services.inventory.canada_warehouse_id');
        $verifySsl  = filter_var(config('services.inventory.verify_ssl', true), FILTER_VALIDATE_BOOL);
        $caBundlePath = trim((string) config('services.inventory.ca_bundle_path', ''));

        if ($baseUrl === '' || $apiKey === '') {
            return response()->json(['message' => 'Inventory API configuration is missing.'], 500);
        }

        $httpOptions = [
            'verify' => $caBundlePath !== '' ? $caBundlePath : $verifySsl,
        ];

        try {
            $response = Http::timeout(20)
                ->withOptions($httpOptions)
                ->acceptJson()
                ->withHeaders(['X-API-Key' => $apiKey])
                ->get($baseUrl . '/api/public/stocks', array_filter(['warehouse_id' => $warehouseId ?: null]));
        } catch (ConnectionException $exception) {
            return response()->json([
                'message' => str_contains($exception->getMessage(), 'cURL error 60')
                    ? 'SSL certificate error. Set INVENTORY_API_VERIFY_SSL=false or configure CA bundle.'
                    : 'Failed to connect to Inventory API.',
            ], 502);
        }

        if (! $response->successful()) {
            $upstream = $response->json();
            return response()->json([
                'message' => is_array($upstream)
                    ? ($upstream['message'] ?? 'Inventory API returned an error.')
                    : 'Inventory API returned an error.',
            ], $response->status());
        }

        $payload = $response->json();
        $stocks  = is_array($payload['data'] ?? null) ? $payload['data'] : (is_array($payload) ? $payload : []);

        if (empty($stocks)) {
            return response()->json(['message' => 'No products returned from Inventory API.', 'synced' => 0]);
        }


        $byName = [];
        foreach ($stocks as $row) {
            if (! is_array($row)) {
                continue;
            }

            $name = trim((string) ($row['product_name'] ?? $row['product']['name'] ?? ''));
            $rawBarcode = $row['barcode'] ?? null;
            if (is_array($rawBarcode)) {
                $rawBarcode = implode('-', array_filter($rawBarcode, 'is_scalar')) ?: null;
            }
            $barcode = is_string($rawBarcode) && trim($rawBarcode) !== ''
                ? trim($rawBarcode)
                : null;

            $price = $this->extractSellingPrice($row);
            if ($name === '') {
                continue;
            }
            $size = $this->normalizeVariantValue($row['size_variant']['size'] ?? ($row['size'] ?? ($row['product']['size'] ?? null)));
            $color = $this->normalizeVariantValue($row['color_variant']['name'] ?? ($row['color'] ?? ($row['product']['color'] ?? null)));
            $stock = (int) ($row['stocks'] ?? $row['available_stock'] ?? 0);

            $coverImage = $row['cover_image_url'] ?? null;
            if ($coverImage && ! str_starts_with($coverImage, 'http')) {
                $coverImage = $baseUrl . '/' . ltrim($coverImage, '/');
            }

            $variantKey = mb_strtolower($name . '|' . ($color ?? 'uncategorized') . '|' . ($size ?? 'no-size'));

            if (! isset($byName[$variantKey])) {
                $byName[$variantKey] = [
                    'sku' => $this->buildProductSku($row['product_id'] ?? null, $name, $color),
                    'name' => $name,
                    'price' => $price ?? 0.0,
                    'stock' => 0,
                    'cover_image' => $coverImage,
                    'colors' => [],
                    'size' => $size,
                    'barcodes' => [],
                    'product_ids' => [],
                    'variants' => [],
                ];
            }

            $byName[$variantKey]['stock'] += max(0, $stock);

            if ($price !== null) {
                $byName[$variantKey]['price'] = $price;
            }

            if (! $byName[$variantKey]['cover_image'] && $coverImage) {
                $byName[$variantKey]['cover_image'] = $coverImage;
            }

            if ($barcode !== null) {
                $byName[$variantKey]['barcodes'][] = $barcode;
            }

            if (! empty($row['product_id'])) {
                $byName[$variantKey]['product_ids'][] = $row['product_id'];
            }

            if ($color !== null) {
                $byName[$variantKey]['colors'][] = $color;
            }

            if ($size !== null && ($byName[$variantKey]['size'] === null || $byName[$variantKey]['size'] === '')) {
                $byName[$variantKey]['size'] = $size;
            }

            $byName[$variantKey]['variants'][] = [
                'color' => $color,
                'size' => $size,
                'price' => $price ?? 0.0,
                'stock' => $stock,
                'barcode' => $barcode,
                'product_id' => $row['product_id'] ?? null,
            ];
        }

        $rows = [];
        foreach ($byName as $item) {
            $colors = array_values(array_unique(array_filter($item['colors'])));
            $size = $item['size'];
            $barcodes = array_values(array_unique(array_filter($item['barcodes'])));
            $productIds = array_values(array_unique(array_filter($item['product_ids'])));

            $rows[] = [
                'name' => $item['name'],
                'sku' => $item['sku'],
                'size' => $size,
                'size_variants' => $size !== null ? [$size] : [],
                'color' => json_encode($colors, JSON_UNESCAPED_SLASHES),
                'available_products' => [
                    'product_name' => $item['name'],
                    'product_ids' => $productIds,
                    'barcodes' => $barcodes,
                    'colors' => $colors,
                    'sizes' => $size !== null ? [$size] : [],
                    'size_variants' => $size !== null ? [$size] : [],
                    'size' => $size,
                    'variants' => $item['variants'],
                    'warehouse_name' => config('services.inventory.canada_warehouse_name', 'Canada Warehouse'),
                    'variant_count' => max(count($colors), $size !== null ? 1 : 0, count($barcodes), 1),
                ],
                'barcode' => $barcodes[0] ?? null,
                'description' => null,
                'price' => $item['price'],
                'cover_image' => $item['cover_image'],
                'stock' => $item['stock'],
                'updated_at' => now()->toDateTimeString(),
                'created_at' => now()->toDateTimeString(),
            ];
        }

        $productColumns = array_flip(Schema::getColumnListing('products'));
        $hasSkuColumn = isset($productColumns['sku']);
        $hasNameColumn = isset($productColumns['name']);

        if (! $hasSkuColumn && ! $hasNameColumn) {
            return response()->json([
                'message' => 'Products table must include at least sku or name column for sync.',
            ], 500);
        }

        foreach ($rows as $row) {
            $lookup = $hasSkuColumn
                ? ['sku' => $row['sku']]
                : ['name' => $row['name']];

            $updateData = [
                'name' => $row['name'],
                'available_products' => $row['available_products'],
                'barcode' => $row['barcode'],
                'size' => $row['size'],
                'color' => $row['color'],
                'description' => $row['description'],
                'price' => $row['price'],
                'cover_image' => $row['cover_image'],
                'stock' => $row['stock'],
            ];

            $updateData = array_filter(
                $updateData,
                fn (mixed $value, string $key): bool => isset($productColumns[$key]),
                ARRAY_FILTER_USE_BOTH,
            );

            Product::query()->updateOrCreate(
                $lookup,
                $updateData,
            );
        }

        return response()->json([
            'message' => 'Products fetched successfully.',
            'products' => $rows,
            'synced'  => count($rows),
        ]);
    }

    private function buildProductSku(mixed $productId, string $name, ?string $color = null): string
    {
        $baseLabel = trim($name . ' ' . ($color ?? ''));
        $baseSku = $productId ? 'INV-' . $productId . ($color ? '-' . Str::slug($color) : '') : Str::slug($baseLabel);

        return substr($baseSku !== '' ? $baseSku : uniqid('inv-', true), 0, 191);
    }

    private function normalizeVariantValue(mixed $value): ?string
    {
        if (! is_scalar($value)) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function extractSellingPrice(array $row): ?float
    {
        $candidates = [
            $row['effective_selling_price'] ?? null,
            $row['selling_price'] ?? null,
            $row['stock_selling_price'] ?? null,
            $row['sellingPrice'] ?? null,
            $row['price'] ?? null,
            $row['product']['selling_price'] ?? null,
            $row['stock']['selling_price'] ?? null,
            $row['size_variant']['selling_price'] ?? null,
        ];

        foreach ($candidates as $candidate) {
            $price = $this->normalizeMoneyValue($candidate);
            if ($price !== null) {
                return $price;
            }
        }

        return null;
    }

    private function normalizeMoneyValue(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_int($value) || is_float($value)) {
            return round((float) $value, 2);
        }

        if (! is_string($value)) {
            return null;
        }

        $normalized = trim($value);
        if ($normalized === '') {
            return null;
        }

        $normalized = str_replace(',', '', $normalized);
        $normalized = preg_replace('/[^0-9.\-]/', '', $normalized) ?? '';

        if ($normalized === '' || ! is_numeric($normalized)) {
            return null;
        }

        return round((float) $normalized, 2);
    }

    private function formatProduct(Product $product): array
    {
        $color = $this->decodeJsonList($product->color);
        $size = $this->decodeJsonList($product->size);
        $warehouseName = config('services.inventory.canada_warehouse_name', 'Canada Warehouse');

        return [
            'id' => $product->id,
            'product_id' => $product->id,
            'name' => $product->name,
            'product_name' => $product->name,
            'slug' => $product->slug,
            'sku' => $product->sku,
            'category_id' => $product->category_id,
            'category' => $product->category
                ? [
                    'id' => $product->category->id,
                    'name' => $product->category->name,
                    'slug' => $product->category->slug,
                ]
                : null,
            'subcategory_id' => $product->subcategory_id,
            'subcategory' => $product->subCategory
                ? [
                    'id' => $product->subCategory->id,
                    'name' => $product->subCategory->name,
                    'slug' => $product->subCategory->slug,
                ]
                : null,
            'grand_child_id' => $product->grand_child_id,
            'grand_child' => $product->grandChild
                ? [
                    'id' => $product->grandChild->id,
                    'name' => $product->grandChild->name,
                    'slug' => $product->grandChild->slug,
                ]
                : null,
            'available_products' => $product->available_products,
            'barcode' => $product->barcode,
            'color' => $color,
            'color_variant' => $this->buildPrimaryColorVariant($color),
            'colors' => $this->buildColorOptions($color),
            'size' => $size,
            'size_variants' => is_array($product->available_products['size_variants'] ?? null)
                ? array_values(array_filter($product->available_products['size_variants']))
                : ($size !== null ? [$size] : []),
            'size_variant' => $this->buildPrimarySizeVariant($size),
            'size_options' => $this->buildSizeOptions($size, $product->variant_rows ?? []),
            'description' => $product->description,
            'long_description' => $product->long_description,
            'fit' => $product->fit,
            'fabric_and_care' => $product->fabric_and_care,
            'product_features' => $product->product_features ?? [],
            'product_composition' => $product->product_composition,
            'additional_information' => $product->additional_information,
            'price' => $product->price,
            'selling_price' => $product->price,
            'stage_prices' => $this->buildStagePrices($product->stage_prices ?? []),
            'cover_image' => $product->cover_image,
            'cover_image_url' => $product->cover_image,
            'image_gallery' => $product->image_gallery ?? [],
            'size_chart_image' => $product->size_chart_image,
            'size_chart_images' => $product->size_chart_images ?? [],
            'variant_rows' => $product->variant_rows ?? [],
            'color_variant_images' => $product->color_variant_images ?? [],
            'color_variant_videos' => $product->color_variant_videos ?? [],
            'color_variant_size_charts' => $product->color_variant_size_charts ?? [],
            'stock' => $product->stock,
            'stocks' => $product->stock,
            'warehouse_name' => $warehouseName,
            'warehouse_id' => (int) config('services.inventory.canada_warehouse_id'),
            'created_at' => $product->created_at,
            'updated_at' => $product->updated_at,
        ];
    }

    /**
     * Resolve stage_id references into full stage ranges so the storefront can pick the
     * matching price tier for the quantity the customer selects.
     */
    private function buildStagePrices(array $rawStagePrices): array
    {
        $stageIds = array_values(array_unique(array_filter(
            array_map(fn ($row) => $row['stage_id'] ?? null, $rawStagePrices)
        )));

        if ($stageIds === []) {
            return [];
        }

        $stages = Stage::query()->whereIn('id', $stageIds)->get()->keyBy('id');

        $result = [];
        foreach ($rawStagePrices as $row) {
            $stage = $stages->get($row['stage_id'] ?? null);
            if (! $stage) {
                continue;
            }

            $result[] = [
                'stage_id' => $stage->id,
                'minimum_quantity' => (int) $stage->minimum_quantity,
                'maximum_quantity' => (int) $stage->maximum_quantity,
                'status' => $row['status'] ?? 'Guest',
                'price' => (float) ($row['price'] ?? 0),
            ];
        }

        return $result;
    }

    private function decodeJsonList(mixed $value): array|string|null
    {
        if (is_array($value)) {
            return array_values(array_filter($value, fn ($item) => is_scalar($item) && trim((string) $item) !== ''));
        }

        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);
        if ($trimmed === '') {
            return null;
        }

        $decoded = json_decode($trimmed, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return array_values(array_filter($decoded, fn ($item) => is_scalar($item) && trim((string) $item) !== ''));
        }

        if (str_contains($trimmed, ',')) {
            $parts = array_values(array_filter(array_map(
                fn ($item) => trim(trim((string) $item), "\"' "),
                explode(',', $trimmed)
            ), fn ($item) => $item !== ''));

            if ($parts !== []) {
                return $parts;
            }
        }

        return $trimmed;
    }

    private function buildPrimaryColorVariant(array|string|null $color): ?array
    {
        $options = $this->buildColorOptions($color);
        if ($options === []) {
            return null;
        }

        return [
            'name' => $options[0]['label'],
            'color_code' => $options[0]['value'],
        ];
    }

    private function buildColorOptions(array|string|null $color): array
    {
        $tokens = is_array($color) ? $color : (is_string($color) && $color !== '' ? [$color] : []);
        $tokens = array_values(array_filter($tokens, fn ($token) => is_string($token) && trim($token) !== ''));

        if ($tokens === []) {
            return [];
        }

        $numericIds = array_values(array_unique(array_filter($tokens, fn ($token) => ctype_digit($token))));
        $colorsById = $numericIds !== []
            ? Color::query()->whereIn('id', $numericIds)->get()->keyBy(fn (Color $color) => (string) $color->id)
            : collect();

        return collect($tokens)
            ->unique(fn ($token) => strtolower(trim($token)))
            ->values()
            ->map(function (string $token) use ($colorsById) {
                $match = $colorsById->get($token);
                $name = $match?->name ?? $token;

                return [
                    'id' => Str::slug($name) ?: $token,
                    // Raw stored token (usually the Color model id) so the frontend can look up
                    // this color's attached images in `color_variant_images`, which is keyed by it.
                    'token' => $token,
                    'label' => $name,
                    'value' => $match?->color_code ?? $this->resolveColorCode($name) ?? '#cccccc',
                ];
            })
            ->all();
    }

    /** @var array<string, array{label: string, position: int}>|null Size id => label, loaded once per request. */
    private ?array $sizeLookup = null;

    /**
     * Readable sizes for storefront filters: the product's stored size tokens (usually Size ids)
     * plus any sizes used in its variant rows, resolved to labels and ordered like the Size admin.
     */
    private function buildSizeOptions(array|string|null $size, array $variantRows): array
    {
        $tokens = is_array($size) ? $size : (is_string($size) && $size !== '' ? [$size] : []);
        foreach ($variantRows as $row) {
            if (is_array($row) && isset($row['size'])) {
                $tokens[] = $row['size'];
            }
        }

        $tokens = array_values(array_unique(array_filter(
            array_map(fn ($token) => is_scalar($token) ? trim((string) $token) : '', $tokens),
            fn (string $token) => $token !== '',
        )));

        if ($tokens === []) {
            return [];
        }

        $this->sizeLookup ??= Size::query()
            ->get(['id', 'Size as label', 'position'])
            ->mapWithKeys(fn (Size $item) => [(string) $item->id => ['label' => (string) $item->label, 'position' => (int) $item->position]])
            ->all();

        return collect($tokens)
            ->map(fn (string $token) => [
                'token' => $token,
                'label' => $this->sizeLookup[$token]['label'] ?? $token,
                'position' => $this->sizeLookup[$token]['position'] ?? PHP_INT_MAX,
            ])
            ->sortBy('position')
            ->values()
            ->all();
    }

    private function buildPrimarySizeVariant(array|string|null $size): ?array
    {
        if (! is_array($size) || empty($size)) {
            return is_string($size) && $size !== '' ? ['size' => $size] : null;
        }

        $first = $size[0] ?? null;
        if (! is_string($first) || $first === '') {
            return null;
        }

        return ['size' => $first];
    }

    private function resolveColorCode(?string $color): ?string
    {
        if ($color === null) {
            return null;
        }

        $map = [
            'black' => '#111827',
            'blue' => '#2563eb',
            'brown' => '#92400e',
            'gray' => '#6b7280',
            'green' => '#16a34a',
            'navy' => '#1d4ed8',
            'orange' => '#ea580c',
            'pink' => '#ec4899',
            'purple' => '#7c3aed',
            'red' => '#dc2626',
            'white' => '#f9fafb',
            'yellow' => '#eab308',
        ];

        return $map[strtolower($color)] ?? null;
    }
}
