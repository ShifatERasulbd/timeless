<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShpByProduct extends Model
{
    
use HasFactory;

    protected $fillable = [
        'title',
        'subtitle',
    ];
    public function items()
    {
        return $this->hasMany(ShpByProductItem::class)->orderBy('sort_order')->orderBy('id');
    }
}
