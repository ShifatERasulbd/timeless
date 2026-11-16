<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    public const ACCOUNT_NORMAL = 'normal';
    public const ACCOUNT_CORPORATE = 'corporate';
    public const ACCOUNT_TYPES = [self::ACCOUNT_NORMAL, self::ACCOUNT_CORPORATE];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'email',
        'account_type',
        'phone',
        'company_name',
        'tax_id',
        'company_address',
        'password',
        'warehouse_ids',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    private ?bool $isAdminCache = null;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'warehouse_ids' => 'array',
        ];
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class);
    }

    public function personalizations(): HasMany
    {
        return $this->hasMany(Personalization::class);
    }

    public function hasRole(string $slug): bool
    {
        return $this->roles()->where('slug', $slug)->exists();
    }

    /** Staff accounts are the ones holding a role; storefront customers never get one. */
    public function isAdmin(): bool
    {
        return $this->isAdminCache ??= $this->roles()->exists();
    }

    public function isCorporate(): bool
    {
        return $this->account_type === self::ACCOUNT_CORPORATE;
    }

    /** Shape returned to the storefront account pages. */
    public function toAccountArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'account_type' => $this->account_type ?? self::ACCOUNT_NORMAL,
            'phone' => $this->phone,
            'company_name' => $this->company_name,
            'tax_id' => $this->tax_id,
            'company_address' => $this->company_address,
            'is_admin' => $this->isAdmin(),
            'created_at' => $this->created_at,
        ];
    }
}
