<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shop_by_industry_items', function (Blueprint $table): void {
            $table->foreignId('category_id')
                ->nullable()
                ->after('shop_by_industry_section_id')
                ->constrained('categories')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('shop_by_industry_items', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('category_id');
        });
    }
};
