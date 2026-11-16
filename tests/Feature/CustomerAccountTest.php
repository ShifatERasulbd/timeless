<?php

namespace Tests\Feature;

use App\Models\CustomerAddress;
use App\Models\Order;
use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class CustomerAccountTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Sanctum only starts a session for API requests coming from the SPA's own domain.
        $this->withHeaders(['Referer' => 'http://localhost', 'Origin' => 'http://localhost']);
    }

    private function customer(array $attributes = []): User
    {
        return User::query()->create([
            'name' => 'Jamie Doe',
            'first_name' => 'Jamie',
            'last_name' => 'Doe',
            'email' => 'jamie@example.com',
            'password' => 'Password123!',
            'account_type' => User::ACCOUNT_NORMAL,
            ...$attributes,
        ]);
    }

    private function admin(): User
    {
        $user = User::query()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => 'Password123!',
        ]);

        $role = Role::query()->firstOrCreate(['slug' => 'super-admin'], ['name' => 'Super Admin']);
        $user->roles()->attach($role);

        return $user;
    }

    private function orderFor(?User $user, array $attributes = []): Order
    {
        $order = Order::query()->create([
            'user_id' => $user?->id,
            'order_number' => 'TF-' . strtoupper(uniqid()),
            'first_name' => 'Jamie',
            'last_name' => 'Doe',
            'email' => 'jamie@example.com',
            'country' => 'Canada',
            'street_address' => '1 King St',
            'state' => 'ON',
            'city' => 'Toronto',
            'zip' => 'M5H 1A1',
            'phone' => '555-0100',
            'subtotal' => 20,
            'shipping' => 10,
            'tax' => 2,
            'total' => 32,
            'status' => 'pending',
            'admin_notes' => 'internal only',
            ...$attributes,
        ]);

        $order->items()->create(['name' => 'Classic Polo', 'price' => 10, 'quantity' => 2]);

        return $order;
    }

    private function addressPayload(array $overrides = []): array
    {
        return [
            'label' => 'Home',
            'first_name' => 'Jamie',
            'last_name' => 'Doe',
            'phone' => '555-0100',
            'country' => 'Canada',
            'street_address' => '1 King St',
            'state' => 'ON',
            'city' => 'Toronto',
            'zip' => 'M5H 1A1',
            ...$overrides,
        ];
    }

    public function test_guest_session_returns_null_user(): void
    {
        $this->getJson('/api/account/session')->assertOk()->assertJson(['user' => null]);
    }

    public function test_normal_customer_can_register_and_is_logged_in(): void
    {
        $this->postJson('/api/account/register', [
            'account_type' => 'normal',
            'first_name' => 'Jamie',
            'last_name' => 'Doe',
            'email' => 'Jamie@Example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])
            ->assertCreated()
            ->assertJsonPath('user.email', 'jamie@example.com')
            ->assertJsonPath('user.account_type', 'normal')
            ->assertJsonPath('user.name', 'Jamie Doe')
            ->assertJsonPath('user.is_admin', false);

        $this->assertAuthenticated();
        $this->getJson('/api/account/session')->assertJsonPath('user.email', 'jamie@example.com');
    }

    public function test_corporate_registration_requires_company_fields(): void
    {
        $this->postJson('/api/account/register', [
            'account_type' => 'corporate',
            'company_name' => 'Acme Ltd',
            'email' => 'buyer@acme.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertUnprocessable()->assertJsonValidationErrors(['tax_id', 'company_address', 'phone']);

        $this->postJson('/api/account/register', [
            'account_type' => 'corporate',
            'company_name' => 'Acme Ltd',
            'email' => 'buyer@acme.test',
            'tax_id' => 'BN-123',
            'company_address' => '9 Bay St, Toronto',
            'phone' => '555-0199',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])
            ->assertCreated()
            ->assertJsonPath('user.account_type', 'corporate')
            ->assertJsonPath('user.name', 'Acme Ltd');
    }

    public function test_registration_rejects_duplicate_email_and_mismatched_passwords(): void
    {
        $this->customer();

        $this->postJson('/api/account/register', [
            'first_name' => 'Other',
            'last_name' => 'Person',
            'email' => 'jamie@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Different123!',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_checks_credentials_and_account_type_tab(): void
    {
        $this->customer(['account_type' => User::ACCOUNT_CORPORATE, 'company_name' => 'Acme']);

        $this->postJson('/api/account/login', ['email' => 'jamie@example.com', 'password' => 'wrong-password'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->postJson('/api/account/login', [
            'email' => 'jamie@example.com',
            'password' => 'Password123!',
            'account_type' => 'normal',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('errors.email.0', 'This email is registered as a corporate account. Please use the Corporate User tab.');
        $this->assertGuest();

        $this->postJson('/api/account/login', [
            'email' => 'jamie@example.com',
            'password' => 'Password123!',
            'account_type' => 'corporate',
        ])->assertOk()->assertJsonPath('user.account_type', 'corporate');
        $this->assertAuthenticated();
    }

    public function test_customer_is_kept_out_of_the_admin_api(): void
    {
        $customer = $this->customer();

        $this->actingAs($customer);
        $this->getJson('/api/orders')->assertForbidden();
        $this->getJson('/api/products')->assertForbidden();
        $this->getJson('/api/personalizations')->assertForbidden();
        $this->putJson('/api/settings/1', [])->assertForbidden();
        $this->getJson('/api/user')->assertOk()->assertJsonPath('is_admin', false);
    }

    public function test_admin_login_endpoint_rejects_customers_but_admits_staff(): void
    {
        $this->customer();
        $this->admin();

        $this->postJson('/api/login', ['email' => 'jamie@example.com', 'password' => 'Password123!'])
            ->assertForbidden()
            ->assertJsonPath('message', 'This account does not have admin access.');
        $this->assertGuest();

        $this->postJson('/api/login', ['email' => 'admin@example.com', 'password' => 'Password123!'])->assertOk();
        $this->getJson('/api/orders')->assertOk();
    }

    public function test_customer_sees_only_their_own_orders_without_admin_notes(): void
    {
        $customer = $this->customer();
        $other = $this->customer(['email' => 'other@example.com']);
        $mine = $this->orderFor($customer);
        $theirs = $this->orderFor($other);
        $this->orderFor($customer, ['status' => 'delivered', 'total' => 50]);
        $this->orderFor($customer, ['status' => 'cancelled', 'total' => 999]);

        $this->actingAs($customer);

        $this->getJson('/api/account/orders')
            ->assertOk()
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('status_counts.pending', 1)
            ->assertJsonMissingPath('data.0.admin_notes');

        $this->getJson('/api/account/orders?status=delivered')->assertJsonPath('meta.total', 1);

        $this->getJson("/api/account/orders/{$mine->order_number}")
            ->assertOk()
            ->assertJsonPath('order_number', $mine->order_number)
            ->assertJsonPath('can_cancel', true)
            ->assertJsonMissingPath('admin_notes');

        $this->getJson("/api/account/orders/{$theirs->order_number}")->assertNotFound();

        // Cancelled orders don't count towards money spent.
        $this->getJson('/api/account/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.total_orders', 3)
            ->assertJsonPath('stats.active_orders', 1)
            ->assertJsonPath('stats.total_spent', 82)
            ->assertJsonCount(3, 'recent_orders');
    }

    public function test_customer_can_cancel_only_pending_orders(): void
    {
        $customer = $this->customer();
        $pending = $this->orderFor($customer);
        $processing = $this->orderFor($customer, ['status' => 'processing']);

        $this->actingAs($customer);

        $this->postJson("/api/account/orders/{$pending->order_number}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->postJson("/api/account/orders/{$processing->order_number}/cancel")->assertUnprocessable();
        $this->assertSame('processing', $processing->fresh()->status);
    }

    public function test_address_book_keeps_exactly_one_default(): void
    {
        $customer = $this->customer();
        $other = $this->customer(['email' => 'other@example.com']);
        $foreign = $other->addresses()->create([...$this->addressPayload(), 'is_default' => true]);

        $this->actingAs($customer);

        $first = $this->postJson('/api/account/addresses', $this->addressPayload())
            ->assertCreated()
            ->assertJsonPath('data.is_default', true)
            ->json('data.id');

        $second = $this->postJson('/api/account/addresses', $this->addressPayload(['label' => 'Office', 'is_default' => true]))
            ->assertCreated()
            ->assertJsonPath('data.is_default', true)
            ->json('data.id');

        $this->assertFalse(CustomerAddress::find($first)->is_default);

        $this->postJson("/api/account/addresses/{$first}/default")->assertOk();
        $this->assertTrue(CustomerAddress::find($first)->is_default);
        $this->assertFalse(CustomerAddress::find($second)->is_default);

        $this->deleteJson("/api/account/addresses/{$first}")->assertOk();
        $this->assertTrue(CustomerAddress::find($second)->is_default);

        $this->putJson("/api/account/addresses/{$second}", $this->addressPayload(['city' => 'Ottawa']))
            ->assertOk()
            ->assertJsonPath('data.city', 'Ottawa')
            ->assertJsonPath('data.is_default', true);

        // Another customer's address is invisible.
        $this->putJson("/api/account/addresses/{$foreign->id}", $this->addressPayload())->assertNotFound();
        $this->deleteJson("/api/account/addresses/{$foreign->id}")->assertNotFound();
        $this->getJson('/api/account/addresses')->assertJsonCount(1);
    }

    public function test_changing_email_requires_current_password(): void
    {
        $customer = $this->customer();
        $this->actingAs($customer);

        $this->putJson('/api/account/profile', [
            'first_name' => 'Jamie',
            'last_name' => 'Smith',
            'email' => 'new@example.com',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');

        $this->putJson('/api/account/profile', [
            'first_name' => 'Jamie',
            'last_name' => 'Smith',
            'email' => 'new@example.com',
            'current_password' => 'Password123!',
        ])
            ->assertOk()
            ->assertJsonPath('user.email', 'new@example.com')
            ->assertJsonPath('user.name', 'Jamie Smith');

        // Same email: no password needed.
        $this->putJson('/api/account/profile', [
            'first_name' => 'Jamie',
            'last_name' => 'Doe',
            'phone' => '555-0111',
            'email' => 'new@example.com',
        ])->assertOk()->assertJsonPath('user.phone', '555-0111');
    }

    public function test_customer_can_change_password(): void
    {
        $customer = $this->customer();
        $this->actingAs($customer);

        $this->putJson('/api/account/password', [
            'current_password' => 'wrong',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');

        $this->putJson('/api/account/password', [
            'current_password' => 'Password123!',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertOk();

        $this->assertTrue(Hash::check('NewPassword123!', $customer->fresh()->password));
    }

    public function test_password_reset_flow_links_to_the_storefront(): void
    {
        Notification::fake();
        $customer = $this->customer();

        // Unknown emails get the same answer so accounts can't be discovered.
        $this->postJson('/api/account/forgot-password', ['email' => 'nobody@example.com'])->assertOk();

        $this->postJson('/api/account/forgot-password', ['email' => 'jamie@example.com'])->assertOk();

        $token = null;
        Notification::assertSentTo($customer, ResetPassword::class, function (ResetPassword $notification) use ($customer, &$token) {
            $token = $notification->token;

            return str_contains($notification->toMail($customer)->actionUrl, '/reset-password/' . $token . '?email=jamie%40example.com');
        });

        $this->postJson('/api/account/reset-password', [
            'token' => 'bad-token',
            'email' => 'jamie@example.com',
            'password' => 'BrandNew123!',
            'password_confirmation' => 'BrandNew123!',
        ])->assertUnprocessable();

        $this->postJson('/api/account/reset-password', [
            'token' => $token,
            'email' => 'jamie@example.com',
            'password' => 'BrandNew123!',
            'password_confirmation' => 'BrandNew123!',
        ])->assertOk();

        $this->assertTrue(Hash::check('BrandNew123!', $customer->fresh()->password));
    }

    public function test_order_placed_while_logged_in_is_linked_and_can_save_the_address(): void
    {
        $customer = $this->customer();
        $this->actingAs($customer);

        $payload = [
            ...$this->addressPayload(),
            'email' => 'jamie@example.com',
            'save_address' => true,
            'items' => [['name' => 'Cap', 'price' => 10, 'quantity' => 1]],
        ];
        unset($payload['label']);

        $this->postJson('/api/orders', $payload)->assertCreated();
        $this->postJson('/api/orders', $payload)->assertCreated();

        $this->assertSame(2, $customer->orders()->count());
        // The second identical address is not saved twice.
        $this->assertSame(1, $customer->addresses()->count());
        $this->assertTrue($customer->addresses()->first()->is_default);
    }

    public function test_logout_ends_the_session(): void
    {
        $this->customer();

        $this->postJson('/api/account/login', ['email' => 'jamie@example.com', 'password' => 'Password123!'])->assertOk();
        $this->assertAuthenticated();

        $this->postJson('/api/account/logout')->assertOk();
        // The session guard; Sanctum's per-request guard keeps its cached user inside a single test.
        $this->assertGuest('web');
    }

    public function test_account_endpoints_require_login(): void
    {
        $this->getJson('/api/account/dashboard')->assertUnauthorized();
        $this->getJson('/api/account/orders')->assertUnauthorized();
        $this->getJson('/api/account/addresses')->assertUnauthorized();
    }
}
