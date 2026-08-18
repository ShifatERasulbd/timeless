<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ShopByIndustryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_by_industry_section_id',
        'title',
        'image',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    protected $appends = [
        'image_url',
    ];

    public function section()
    {
        return $this->belongsTo(ShopByIndustrySection::class, 'shop_by_industry_section_id');
    }

    public function getImageUrlAttribute(): ?string
    {
        if (blank($this->image)) {
            return null;
        }

        if (Str::startsWith($this->image, ['http://', 'https://', '//'])) {
            return $this->image;
        }

        return url('/' . ltrim($this->image, '/'));
    }
}
