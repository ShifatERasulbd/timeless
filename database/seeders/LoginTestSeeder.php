<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class LoginTestSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed a deterministic test account for login verification.
     */
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'login-test@example.com'],
            [
                'name' => 'Login Test User',
                'password' => 'Password123!',
            ]
        );

        // The admin API only admits accounts with a role.
        $superAdmin = Role::query()->where('slug', 'super-admin')->first();
        if ($superAdmin) {
            $user->roles()->syncWithoutDetaching([$superAdmin->id]);
        }
    }
}
