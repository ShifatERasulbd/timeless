<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Hero extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'title_font_size',
        'title_font_family',
        'description_font_size',
        'description_font_family',
        'image',
        'video',
        'ticker_text',
        'sub_title',
        'button_enabled',
        'button_text',
    ];

    protected $casts = [
        'title_font_size' => 'integer',
        'description_font_size' => 'integer',
        'button_enabled' => 'boolean',
    ];

    protected $appends = [
        'image_url',
        'video_url',
    ];

    public function slides()
    {
        return $this->hasMany(HeroSlide::class)->orderBy('sort_order')->orderBy('id');
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->normalizeMediaUrl($this->image);
    }

    public function getVideoUrlAttribute(): ?string
    {
        return $this->normalizeMediaUrl($this->video);
    }

    private function normalizeMediaUrl(?string $value): ?string
    {
        if (blank($value)) {
            return null;
        }

        if (Str::startsWith($value, ['http://', 'https://', '//'])) {
            return $value;
        }

        return url('/' . ltrim($value, '/'));
    }
}
