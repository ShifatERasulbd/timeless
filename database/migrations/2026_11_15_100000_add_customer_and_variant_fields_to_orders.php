<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('email')->nullable()->after('last_name');
            $table->text('notes')->nullable()->after('phone');
            $table->text('admin_notes')->nullable()->after('status');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->string('color', 100)->nullable()->after('name');
            $table->string('size', 100)->nullable()->after('color');
            $table->json('design')->nullable()->after('size');
            // Product images can be long absolute URLs from the inventory sync.
            $table->text('image')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['color', 'size', 'design']);
            $table->string('image')->nullable()->change();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['email', 'notes', 'admin_notes']);
        });
    }
};
