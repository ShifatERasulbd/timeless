<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Repurposes the personalizer_prices table from order-quantity tiers to per-component
     * design-element size tiers (measured as corner-to-corner inches).
     */
    public function up(): void
    {
        Schema::dropIfExists('personalizer_prices');

        Schema::create('personalizer_prices', function (Blueprint $table) {
            $table->id();
            $table->decimal('minimum_size', 8, 2);
            $table->decimal('maximum_size', 8, 2);
            $table->decimal('price', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personalizer_prices');

        Schema::create('personalizer_prices', function (Blueprint $table) {
            $table->id();
            $table->integer('minimum_quantity');
            $table->integer('maximum_quantity');
            $table->decimal('price', 10, 2);
            $table->timestamps();
        });
    }
};
