<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomFieldValue extends Model
{
    use HasFactory;

    protected $fillable = [
        'custom_field_id', 'entity_id', 'value',
    ];

    public function customField(): BelongsTo
    {
        return $this->belongsTo(CustomField::class);
    }
}
