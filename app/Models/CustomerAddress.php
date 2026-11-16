<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerAddress extends Model
{
    public const MAX_PER_USER = 20;

    protected $fillable = [
        'user_id',
        'label',
        'first_name',
        'last_name',
        'company_name',
        'phone',
        'country',
        'street_address',
        'apartment',
        'state',
        'city',
        'zip',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'company_name' => $this->company_name,
            'phone' => $this->phone,
            'country' => $this->country,
            'street_address' => $this->street_address,
            'apartment' => $this->apartment,
            'state' => $this->state,
            'city' => $this->city,
            'zip' => $this->zip,
            'is_default' => $this->is_default,
        ];
    }
}
