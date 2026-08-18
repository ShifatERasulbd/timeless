<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const COLUMNS = [
        'slug',
        'fit',
        'fabric_and_care',
        'product_features',
        'product_composition',
        'discount_price',
        'length',
        'width',
        'height',
        'size_chart_image',
        'size_chart_images',
        'image_gallery',
        'product_videos',
        'variant_rows',
        'color_variant_images',
        'color_variant_videos',
        'color_variant_size_charts',
        'grand_child_id',
        'show_on_best_sellers',
    ];

    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'slug')) {
                $table->string('slug')->nullable()->unique();
            }
            if (! Schema::hasColumn('products', 'fit')) {
                $table->longText('fit')->nullable();
            }
            if (! Schema::hasColumn('products', 'fabric_and_care')) {
                $table->longText('fabric_and_care')->nullable();
            }
            if (! Schema::hasColumn('products', 'product_features')) {
                $table->json('product_features')->nullable();
            }
            if (! Schema::hasColumn('products', 'product_composition')) {
                $table->longText('product_composition')->nullable();
            }
            if (! Schema::hasColumn('products', 'discount_price')) {
                $table->decimal('discount_price', 10, 2)->nullable();
            }
            if (! Schema::hasColumn('products', 'length')) {
                $table->decimal('length', 10, 2)->nullable();
            }
            if (! Schema::hasColumn('products', 'width')) {
                $table->decimal('width', 10, 2)->nullable();
            }
            if (! Schema::hasColumn('products', 'height')) {
                $table->decimal('height', 10, 2)->nullable();
            }
            if (! Schema::hasColumn('products', 'size_chart_image')) {
                $table->string('size_chart_image')->nullable();
            }
            if (! Schema::hasColumn('products', 'size_chart_images')) {
                $table->json('size_chart_images')->nullable();
            }
            if (! Schema::hasColumn('products', 'image_gallery')) {
                $table->json('image_gallery')->nullable();
            }
            if (! Schema::hasColumn('products', 'product_videos')) {
                $table->json('product_videos')->nullable();
            }
            if (! Schema::hasColumn('products', 'variant_rows')) {
                $table->json('variant_rows')->nullable();
            }
            if (! Schema::hasColumn('products', 'color_variant_images')) {
                $table->json('color_variant_images')->nullable();
            }
            if (! Schema::hasColumn('products', 'color_variant_videos')) {
                $table->json('color_variant_videos')->nullable();
            }
            if (! Schema::hasColumn('products', 'color_variant_size_charts')) {
                $table->json('color_variant_size_charts')->nullable();
            }
            if (! Schema::hasColumn('products', 'grand_child_id')) {
                $table->unsignedBigInteger('grand_child_id')->nullable()->index();
            }
            if (! Schema::hasColumn('products', 'show_on_best_sellers')) {
                $table->boolean('show_on_best_sellers')->default(false);
            }
        });
    }

    public function down(): void
    {
        $columns = array_values(array_filter(
            self::COLUMNS,
            static fn (string $column): bool => Schema::hasColumn('products', $column),
        ));

        if ($columns !== []) {
            Schema::table('products', function (Blueprint $table) use ($columns) {
                $table->dropColumn($columns);
            });
        }
    }
};