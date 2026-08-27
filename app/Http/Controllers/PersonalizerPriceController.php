<?php

namespace App\Http\Controllers;

use App\Models\PersonalizerPrice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PersonalizerPriceController extends Controller
{
    public function index(): JsonResponse
    {
        $personalizerPrices = PersonalizerPrice::orderBy('minimum_size')->get();
        return response()->json($personalizerPrices);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePrice($request);
        $personalizerPrice = PersonalizerPrice::create($validated);
        return response()->json($personalizerPrice, 201);
    }

    public function show(PersonalizerPrice $personalizerPrice): JsonResponse
    {
        return response()->json($personalizerPrice);
    }

    public function update(Request $request, PersonalizerPrice $personalizerPrice): JsonResponse
    {
        $validated = $this->validatePrice($request);
        $personalizerPrice->update($validated);
        return response()->json($personalizerPrice);
    }

    public function destroy(PersonalizerPrice $personalizerPrice): JsonResponse
    {
        $personalizerPrice->delete();
        return response()->json($personalizerPrice);
    }

    private function validatePrice(Request $request): array
    {
        return $request->validate([
            'minimum_size' => ['required', 'numeric', 'min:0'],
            'maximum_size' => ['required', 'numeric', 'gte:minimum_size'],
            'price' => ['required', 'numeric', 'min:0'],
        ]);
    }
}
