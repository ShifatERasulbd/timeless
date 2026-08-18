<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Stage;
use Illuminate\Http\JsonResponse;

class StageController extends Controller
{
    public function index():JsonResponse
    {
        $stages = Stage::all();
        return response()->json($stages);
    }

    public function store(Request $request): JsonResponse
    {
        $validated =$request->validate([
            'minimum_quantity' => ['required', 'integer'],
            'maximum_quantity' => ['required', 'integer'],
        ]);
        $stage = Stage::create($validated);
        return response()->json($stage,201);
    }

    public function show (Stage $stage): JsonResponse
    {
        return response()->json($stage);
    }

    public function update(Request $request, Stage $stage): JsonResponse
    {
        $validated=$request->validate([
            'minimum_quantity' => ['required', 'integer'],
            'maximum_quantity' => ['required', 'integer'],
        ]);
        $stage->update($validated);
        return response()->json($stage);
    }

    public function destroy(Stage $stage):JsonResponse
    {
        $stage->delete();
        return response()->json($stage);
    }

    
}
