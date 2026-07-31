<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\DeveloperActionLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $logs = DeveloperActionLog::with('developer:id,name,email')
            ->when($request->filled('developer_id'), fn ($q) => $q->where('developer_id', $request->developer_id))
            ->when($request->filled('action'), fn ($q) => $q->where('action', 'like', "%{$request->action}%"))
            ->when($request->filled('from'), fn ($q) => $q->whereDate('created_at', '>=', $request->from))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('created_at', '<=', $request->to))
            ->orderByDesc('created_at')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('Developer/AuditLog/Index', [
            'logs' => $logs,
            'developers' => User::where('is_developer', true)->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['developer_id', 'action', 'from', 'to']),
        ]);
    }
}
