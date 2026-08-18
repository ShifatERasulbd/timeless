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
        Schema::table('heroes', function (Blueprint $table) {
            $table->string('ticker_text', 255)->nullable()->after('video');
            $table->string('sub_title', 255)->nullable()->after('ticker_text');
            $table->boolean('button_enabled')->default(true)->after('sub_title');
            $table->string('button_text', 255)->nullable()->after('button_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('heroes', function (Blueprint $table) {
            $table->dropColumn([
                'ticker_text',
                'sub_title',
                'button_enabled',
                'button_text',
            ]);
        });
    }
};
