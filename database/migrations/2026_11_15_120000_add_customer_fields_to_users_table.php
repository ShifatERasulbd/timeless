<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // 'normal' or 'corporate' for storefront customers; null for staff accounts created before this.
            $table->string('account_type', 20)->nullable()->after('email')->index();
            $table->string('first_name')->nullable()->after('name');
            $table->string('last_name')->nullable()->after('first_name');
            $table->string('phone', 50)->nullable()->after('account_type');
            $table->string('company_name')->nullable()->after('phone');
            $table->string('tax_id', 100)->nullable()->after('company_name');
            $table->text('company_address')->nullable()->after('tax_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['account_type']);
            $table->dropColumn([
                'account_type',
                'first_name',
                'last_name',
                'phone',
                'company_name',
                'tax_id',
                'company_address',
            ]);
        });
    }
};
