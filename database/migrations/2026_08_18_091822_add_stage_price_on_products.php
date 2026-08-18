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
        if (! Schema::hasColumn('products', 'stage_prices')) {
            Schema::table('products', function (Blueprint $table) {
                $table->json('stage_prices')->nullable()->after('price');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('products', 'stage_prices')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('stage_prices');
            });
        }
    }
};
