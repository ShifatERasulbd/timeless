<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GrandChilds extends Model
{
    use HasFactory;

    protected $table = 'grand_childs';

    protected $fillable = [
        'name',
        'slug',
        'sub_category_id',
        'category_id',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'sub_category_id' => 'integer',
            'category_id' => 'integer',
            'position' => 'integer',
        ];
    }

    public function subCategory()
    {
        return $this->belongsTo(SubCategory::class, 'sub_category_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
