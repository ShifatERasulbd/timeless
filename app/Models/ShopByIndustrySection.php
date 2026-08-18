<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShopByIndustrySection extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'subtitle',
    ];

    public function items()
    {
        return $this->hasMany(ShopByIndustryItem::class)->orderBy('sort_order')->orderBy('id');
    }
}
