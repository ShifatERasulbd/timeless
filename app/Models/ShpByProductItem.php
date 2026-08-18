<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ShpByProductItem extends Model
{
     use HasFactory;
     protected $fillable = [
          'shp_by_product_id',
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
        return $this->belongsTo(ShpByProduct::class, 'shp_by_product_id');
    }

    public function getImageUrlAttribute(): ?string
    {
        if (blank($this->image)) {
            return null;
        }

        if (Str::startsWith($this->image, ['http://', 'https://', '//'])) {
            return $this->image;
        }

        return url('/storage/' . ltrim($this->image, '/'));
    }
}
 