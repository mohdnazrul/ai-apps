<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AiTryStatusController extends Controller
{
    public function __invoke(Request $request)
    {
        if ($request->user()) {
            return response()->json([
                'is_authenticated' => true,
                'remaining' => null,
                'limit' => null,
                'used' => null,
            ]);
        }

        $limit = 5;
        $used = (int) $request->session()->get('ai_try_count', 0);
        $remaining = max(0, $limit - $used);

        return response()->json([
            'is_authenticated' => false,
            'remaining' => $remaining,
            'limit' => $limit,
            'used' => $used,
        ]);
    }
}
