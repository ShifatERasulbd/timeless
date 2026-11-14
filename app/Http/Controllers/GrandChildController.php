<?php

namespace App\Http\Controllers;

use App\Models\GrandChilds;
use App\Models\Product;
use App\Models\SubCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class GrandChildController extends Controller
{
    private const RELATIONS = ['category:id,name,slug', 'subCategory:id,name,slug,category_id'];

    private function orderedGrandChildsQuery()
    {
        return GrandChilds::query()->with(self::RELATIONS)->orderBy('position')->orderBy('id');
    }

    private function validated(Request $request, ?GrandChilds $grandChild = null): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('grand_childs', 'slug')->ignore($grandChild?->id)],
            'sub_category_id' => ['required', 'integer', 'exists:sub_categories,id'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
        ]);

        // The category always follows the chosen sub-category, so the two can never disagree.
        $validated['category_id'] = SubCategory::query()->whereKey($validated['sub_category_id'])->value('category_id');

        return $validated;
    }

    public function index(): JsonResponse
    {
        return response()->json($this->orderedGrandChildsQuery()->get());
    }

    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'exists:grand_childs,id'],
        ]);

        $ids = array_values(array_unique(array_map('intval', $validated['ids'])));

        DB::transaction(function () use ($ids) {
            foreach ($ids as $index => $id) {
                GrandChilds::query()->whereKey($id)->update(['position' => $index + 1]);
            }
        });

        return response()->json($this->orderedGrandChildsQuery()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validated($request);
        // New entries go to the end of the list.
        $validated['position'] = (int) GrandChilds::query()->max('position') + 1;

        $grandChild = GrandChilds::query()->create($validated)->load(self::RELATIONS);

        return response()->json($grandChild, 201);
    }

    public function show(GrandChilds $grandChild): JsonResponse
    {
        return response()->json($grandChild->load(self::RELATIONS));
    }

    public function update(Request $request, GrandChilds $grandChild): JsonResponse
    {
        $grandChild->update($this->validated($request, $grandChild));

        return response()->json($grandChild->fresh(self::RELATIONS));
    }

    public function destroy(GrandChilds $grandChild): JsonResponse
    {
        DB::transaction(function () use ($grandChild) {
            // products.grand_child_id has no foreign key, so detach products by hand.
            Product::query()->where('grand_child_id', $grandChild->id)->update(['grand_child_id' => null]);
            $grandChild->delete();
        });

        return response()->json(['message' => 'GrandChild deleted successfully']);
    }
}
