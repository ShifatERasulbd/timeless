<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shp_by_product_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shop_by_industry_section_id');
            $table->foreignId('shp_by_product_id')
                ->after('id')
                ->constrained('shp_by_products')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('shp_by_product_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shp_by_product_id');
            $table->foreignId('shop_by_industry_section_id')
                ->after('id')
                ->constrained('shop_by_industry_sections')
                ->cascadeOnDelete();
        });
    }
};