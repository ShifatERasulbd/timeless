<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PersonalizerPrice extends Model
{
    use HasFactory;

    protected $fillable = [
        'minimum_size',
        'maximum_size',
        'price',
    ];

    protected function casts(): array
    {
        return [
            'minimum_size' => 'decimal:2',
            'maximum_size' => 'decimal:2',
            'price' => 'decimal:2',
        ];
    }
}
