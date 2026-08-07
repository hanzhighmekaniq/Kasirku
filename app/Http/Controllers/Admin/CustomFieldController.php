<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CustomField;
use App\Models\CustomFieldValue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CustomFieldController extends Controller
{
    public function index(Request $request)
    {
        $storeId = session('current_store_id');
        $entityType = $request->get('entity_type', 'product');

        $fields = CustomField::where('store_id', $storeId)
            ->where('entity_type', $entityType)
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Admin/CustomFields/Index', [
            'fields' => $fields,
            'entityType' => $entityType,
        ]);
    }

    public function store(Request $request)
    {
        $storeId = session('current_store_id');

        $validated = $request->validate([
            'entity_type' => 'required|in:product,customer',
            'field_name' => [
                'required', 'string', 'max:100', 'regex:/^[a-z][a-z0-9_]*$/',
                Rule::unique('custom_fields')
                    ->where('store_id', $storeId)
                    ->where('entity_type', $request->entity_type),
            ],
            'field_label' => 'required|string|max:100',
            'field_type' => 'required|in:text,number,date,select,textarea',
            'options' => 'nullable|array',
            'is_required' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        $validated['store_id'] = $storeId;
        $validated['is_required'] = $validated['is_required'] ?? false;
        $validated['sort_order'] = $validated['sort_order'] ?? 0;

        $field = CustomField::create($validated);

        return response()->json(['field' => $field, 'success' => true]);
    }

    public function update(Request $request, CustomField $customField)
    {
        $storeId = session('current_store_id');
        abort_unless((int) $customField->store_id === (int) $storeId, 403);

        $validated = $request->validate([
            'field_label' => 'sometimes|string|max:100',
            'field_type' => 'sometimes|in:text,number,date,select,textarea',
            'options' => 'nullable|array',
            'is_required' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        $customField->update($validated);

        return response()->json(['field' => $customField->fresh(), 'success' => true]);
    }

    public function destroy(CustomField $customField)
    {
        $storeId = session('current_store_id');
        abort_unless((int) $customField->store_id === (int) $storeId, 403);

        $customField->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Simpan nilai custom fields untuk entity tertentu.
     */
    public function saveValues(Request $request)
    {
        $storeId = session('current_store_id');

        $validated = $request->validate([
            'entity_type' => 'required|in:product,customer',
            'entity_id' => 'required|integer',
            'values' => 'required|array',
            'values.*.custom_field_id' => 'required|exists:custom_fields,id',
            'values.*.value' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();

        try {
            foreach ($validated['values'] as $item) {
                $field = CustomField::where('store_id', $storeId)
                    ->where('id', $item['custom_field_id'])
                    ->first();

                if (! $field) {
                    continue;
                }

                CustomFieldValue::updateOrCreate(
                    [
                        'custom_field_id' => $item['custom_field_id'],
                        'entity_id' => $validated['entity_id'],
                    ],
                    ['value' => $item['value']],
                );
            }

            DB::commit();

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Ambil nilai custom fields untuk entity tertentu.
     */
    public function getValues(Request $request)
    {
        $storeId = session('current_store_id');

        $entityType = $request->get('entity_type');
        $entityId = $request->get('entity_id');

        $fields = CustomField::where('store_id', $storeId)
            ->where('entity_type', $entityType)
            ->orderBy('sort_order')
            ->get();

        $values = CustomFieldValue::whereIn('custom_field_id', $fields->pluck('id'))
            ->where('entity_id', $entityId)
            ->pluck('value', 'custom_field_id')
            ->toArray();

        $result = $fields->map(fn ($field) => [
            'id' => $field->id,
            'field_name' => $field->field_name,
            'field_label' => $field->field_label,
            'field_type' => $field->field_type,
            'options' => $field->options,
            'is_required' => $field->is_required,
            'value' => $values[$field->id] ?? null,
        ])->toArray();

        return response()->json(['fields' => $result]);
    }
}
