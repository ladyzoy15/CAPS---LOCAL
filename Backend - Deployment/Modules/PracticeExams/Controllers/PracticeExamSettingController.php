<?php

namespace Modules\PracticeExams\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Modules\PracticeExams\Models\PracticeExamSetting;
use Illuminate\Support\Facades\Log;

class PracticeExamSettingController extends Controller
{
    public function store(Request $request)
    {
        try {
            $user = Auth::user();

            if (!in_array($user->roleID, [3, 4, 5])) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

            $validated = $request->validate([
                'subjectID' => 'required|exists:subjects,subjectID',
                'isEnabled' => 'required|boolean',
                'enableTimer' => 'required|boolean',
                'duration_minutes' => 'nullable|integer|max:240',
                'coverage' => 'required|in:midterm,final,full',
                'easy_percentage' => 'required|integer|min:0|max:100',
                'moderate_percentage' => 'required|integer|min:0|max:100',
                'hard_percentage' => 'required|integer|min:0|max:100',
                'total_items' => 'required|integer|min:1|max:100',
            ]);

            $total = $validated['easy_percentage'] + $validated['moderate_percentage'] + $validated['hard_percentage'];
            if ($total !== 100) {
                return response()->json(['message' => 'Percentages must total 100.'], 422);
            }

            PracticeExamSetting::where('subjectID', $validated['subjectID'])->delete();

            if ($validated['enableTimer']) {
                $validated['duration_minutes'] = $validated['duration_minutes'] ?? 30;
            } else {
                $validated['duration_minutes'] = 0;
            }

            $setting = PracticeExamSetting::create(array_merge($validated, [
                'createdBy' => $user->userID,
            ]));

            return response()->json([
                'message' => 'Settings saved successfully.',
                'data' => $setting
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Practice exam setting error: ' . $e->getMessage());

            return response()->json([
                'message' => 'An internal error occurred.'
            ], 500);
        }
    }

    /**
     * Show existing practice exam settings for a subject.
     * Returns 200 with null data if no settings exist yet —
     * this is a valid state (subject not yet configured), not an error.
     */
    public function show($subjectID)
    {
        try {
            $setting = PracticeExamSetting::where('subjectID', $subjectID)->first();

            return response()->json([
                'message' => $setting
                    ? 'Practice exam setting retrieved successfully.'
                    : 'No practice exam setting configured yet for this subject.',
                'data' => $setting
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching practice exam setting: ' . $e->getMessage());

            return response()->json([
                'error' => 'Internal Server Error',
                'message' => 'An internal error occurred.'
            ], 500);
        }
    }
}