<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('products', 'position')) {
            Schema::table('products', function (Blueprint $table) {
                $table->unsignedInteger('position')->nullable()->after('stock');
            });
        }

        DB::table('products')
            ->whereNull('position')
            ->orderByDesc('updated_at')
            ->orderBy('id')
            ->pluck('id')
            ->each(function ($id, $index) {
                DB::table('products')->where('id', $id)->update(['position' => $index + 1]);
            });
    }

    public function down(): void
    {
        if (Schema::hasColumn('products', 'position')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('position');
            });
        }
    }
};