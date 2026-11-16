<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    /** The order admin endpoints only admit staff, i.e. users holding a role. */
    private function adminUser(): User
    {
        $user = User::factory()->create();
        $role = Role::query()->firstOrCreate(['slug' => 'super-admin'], ['name' => 'Super Admin']);
        $user->roles()->attach($role);

        return $user;
    }

    private function checkoutPayload(array $overrides = []): array
    {
        return array_merge([
            'first_name' => 'Jamie',
            'last_name' => 'Doe',
            'email' => 'jamie@example.com',
            'company_name' => null,
            'country' => 'Canada',
            'street_address' => '1 King St',
            'apartment' => 'Unit 4',
            'state' => 'ON',
            'city' => 'Toronto',
            'zip' => 'M5H 1A1',
            'phone' => '555-0100',
            'notes' => 'Leave at the door',
            'items' => [
                [
                    'product_id' => 12,
                    'name' => 'Classic Polo',
                    'image' => '/storage/products/polo.webp',
                    'color' => 'Navy',
                    'size' => 'M',
                    'design' => ['title' => 'Logo', 'image' => 'data:image/png;base64,AAAA', 'unit_price' => 2.5],
                    'price' => 22.50,
                    'quantity' => 2,
                ],
                [
                    'product_id' => null,
                    'name' => 'Cap',
                    'price' => 10,
                    'quantity' => 1,
                ],
            ],
            // Client-sent totals are ignored in favour of the server's own calculation.
            'subtotal' => 0.01,
            'total' => 0.01,
        ], $overrides);
    }

    public function test_guest_can_place_an_order_with_server_calculated_totals(): void
    {
        $response = $this->postJson('/api/orders', $this->checkoutPayload());

        $response->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.email', 'jamie@example.com')
            ->assertJsonPath('data.subtotal', 55)
            ->assertJsonPath('data.shipping', 10)
            ->assertJsonPath('data.tax', 5.5)
            ->assertJsonPath('data.total', 70.5)
            ->assertJsonPath('data.items.0.product_id', 12)
            ->assertJsonPath('data.items.0.color', 'Navy')
            ->assertJsonPath('data.items.0.size', 'M')
            ->assertJsonPath('data.items.0.design.title', 'Logo')
            // Inline previews are not stored.
            ->assertJsonPath('data.items.0.design.image', null)
            ->assertJsonPath('data.items.0.line_total', 45);

        $this->assertSame(2, OrderItem::query()->where('order_id', $response->json('data.id'))->count());
    }

    public function test_checkout_requires_customer_details(): void
    {
        $this->postJson('/api/orders', $this->checkoutPayload(['email' => 'not-an-email', 'first_name' => '']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'first_name']);

        $this->postJson('/api/orders', $this->checkoutPayload(['items' => []]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['items']);
    }

    public function test_order_admin_endpoints_require_authentication(): void
    {
        $order = Order::query()->create([
            ...collect($this->checkoutPayload())->except(['items', 'notes', 'subtotal', 'total'])->all(),
            'order_number' => 'TF-TEST',
            'status' => 'pending',
        ]);

        $this->getJson('/api/orders')->assertUnauthorized();
        $this->getJson("/api/orders/{$order->id}")->assertUnauthorized();
        $this->putJson("/api/orders/{$order->id}", ['status' => 'shipped'])->assertUnauthorized();
    }

    public function test_admin_can_view_and_update_an_order(): void
    {
        $orderId = $this->postJson('/api/orders', $this->checkoutPayload())->json('data.id');
        $this->actingAs($this->adminUser(), 'sanctum');

        $this->getJson('/api/orders')->assertOk()->assertJsonPath('0.id', $orderId);

        $order = $this->getJson("/api/orders/{$orderId}")->assertOk()->json();
        [$polo, $cap] = $order['items'];

        // Status-only change.
        $this->putJson("/api/orders/{$orderId}", ['status' => 'processing'])
            ->assertOk()
            ->assertJsonPath('data.status', 'processing')
            ->assertJsonPath('data.total', 70.5);

        // Full edit: details, notes, shipping, change one line and drop the other.
        $this->putJson("/api/orders/{$orderId}", [
            'status' => 'shipped',
            'city' => 'Ottawa',
            'admin_notes' => 'Tracking 1Z999',
            'shipping' => 0,
            'items' => [
                ['id' => $polo['id'], 'color' => 'Black', 'size' => 'L', 'price' => 20, 'quantity' => 3],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'shipped')
            ->assertJsonPath('data.city', 'Ottawa')
            ->assertJsonPath('data.admin_notes', 'Tracking 1Z999')
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.color', 'Black')
            ->assertJsonPath('data.items.0.quantity', 3)
            ->assertJsonPath('data.subtotal', 60)
            ->assertJsonPath('data.shipping', 0)
            ->assertJsonPath('data.tax', 6)
            ->assertJsonPath('data.total', 66);

        $this->assertDatabaseMissing('order_items', ['id' => $cap['id']]);
    }

    public function test_admin_update_rejects_invalid_status_and_foreign_items(): void
    {
        $first = $this->postJson('/api/orders', $this->checkoutPayload())->json('data');
        $second = $this->postJson('/api/orders', $this->checkoutPayload())->json('data');
        $this->actingAs($this->adminUser(), 'sanctum');

        $this->putJson("/api/orders/{$first['id']}", ['status' => 'teleported'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);

        $this->putJson("/api/orders/{$first['id']}", [
            'items' => [['id' => $second['items'][0]['id'], 'price' => 1, 'quantity' => 1]],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['items.0.id']);
    }
}
