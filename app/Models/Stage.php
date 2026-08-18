<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Stage extends Model
{
    use HasFactory;

    protected $table = 'statges';

    protected $fillable = [
        'minimum_quantity',
        'maximum_quantity',
    ];
}