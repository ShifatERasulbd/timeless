<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HowWeHelpSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
    ];

    public function items()
    {
        return $this->hasMany(HowWeHelpItem::class)->orderBy('sort_order')->orderBy('id');
    }
}