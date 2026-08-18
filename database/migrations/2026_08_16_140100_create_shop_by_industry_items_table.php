<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('shop_by_industry_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_by_industry_section_id')
                ->constrained('shop_by_industry_sections')
                ->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->string('image')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shop_by_industry_items');
    }
};
