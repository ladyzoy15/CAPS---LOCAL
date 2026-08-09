<?php

namespace Modules\Users\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Users\Models\Campus;

class CampusController extends Controller
{
    public function index()
    {
        try {
            $campuses = Campus::select('campusID', 'campusName')->get();

            return response()->json([
                'message' => 'Campuses fetched successfully.',
                'data' => $campuses,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch campuses.',
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'campusName' => 'required|string|max:100|unique:campuses,campusName',
        ]);

        $campus = Campus::create($validated);

        return response()->json([
            'message' => 'Campus created successfully.',
            'data' => $campus,
        ], 201);
    }
}
