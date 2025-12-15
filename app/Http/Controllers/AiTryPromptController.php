<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AiTryPromptController extends Controller
{
    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:500'],
        ]);

        // ─────────────────────────────────────────────
        // Guest limit: 5 tries per session
        // ─────────────────────────────────────────────
        $remaining = null;

        if (!$request->user()) {
            $limit = 5;
            $used = (int) $request->session()->get('ai_try_count', 0);

            if ($used >= $limit) {
                return response()->json([
                    'message' => 'Please log in to continue using AI.',
                    'requires_login' => true,
                    'remaining' => 0,
                ], 401);
            }

            $used++;
            $request->session()->put('ai_try_count', $used);
            $remaining = max(0, $limit - $used);
        }

        $userText = trim($data['message']);

        try {
            Log::info('AI TRY: request', [
                'user_id' => optional($request->user())->id,
                'message' => $userText,
            ]);

            // Your disk "local" root is storage/app/private
            $path = 'ai/demo_dataset.json';

            if (!Storage::exists($path)) {
                Log::warning('AI TRY: dataset missing', ['path' => $path]);

                return response()->json([
                    'message' => 'Dataset is missing. Please contact the administrator.',
                    'remaining' => $remaining,
                    'requires_login' => false,
                ], 500);
            }

            $dataset = json_decode(Storage::get($path), true);
            if (!is_array($dataset)) $dataset = [];

            [$answer, $intent] = $this->answerFromDataset($userText, $dataset);

            Log::info('AI TRY: matched intent', [
                'intent' => $intent,
                'has_answer' => (bool) $answer,
            ]);

            if (!$answer) {
                return response()->json([
                    'message' => 'Sorry, your request is out of range. Please contact the administrator.',
                    'remaining' => $remaining,
                    'requires_login' => false,
                ], 422);
            }

            return response()->json([
                'answer' => $answer,
                'remaining' => $remaining,
                'requires_login' => false,
            ]);
        } catch (\Throwable $e) {
            Log::error('AI TRY: exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Request failed',
                'error' => $e->getMessage(),
                'remaining' => $remaining,
            ], 500);
        }
    }

    /**
     * Returns: [answerText|null, intentString]
     */
    private function answerFromDataset(string $q, array $data): array
    {
        $qLower = mb_strtolower(trim($q));

        // helpers
        $hasAny = function (array $needles) use ($qLower): bool {
            foreach ($needles as $n) {
                if ($n !== '' && str_contains($qLower, $n)) return true;
            }
            return false;
        };

        // ─────────────────────────────────────────────
        // 0) Greetings / help
        // ─────────────────────────────────────────────
        if ($hasAny(['hi', 'hello', 'hey', 'hai', 'hye', 'assalamualaikum'])) {
            $help = "Hello! I’m ERP AI (demo dataset mode).\n\nTry:\n"
                . "- Show unpaid invoices > RM 10k\n"
                . "- Who has overdue payments?\n"
                . "- List low stock items below reorder point\n"
                . "- Show production delays\n"
                . "- Show approval workflow";
            return [$help, 'greeting'];
        }

        // ─────────────────────────────────────────────
        // 1) Invoices / unpaid / outstanding / overdue
        // Supports:
        // - "unpaid invoices rm10k top 10"
        // - "outstanding bills above 10000"
        // - "overdue invoices"
        // ─────────────────────────────────────────────
        $isInvoiceQuery = $hasAny(['invoice', 'invoices', 'bill', 'bills']);
        $isUnpaidQuery  = $hasAny(['unpaid', 'outstanding', 'not paid', 'pending']);
        $isOverdueQuery = $hasAny(['overdue', 'past due', 'late payment', 'late']);

        if ($isInvoiceQuery && ($isUnpaidQuery || $isOverdueQuery)) {
            $min = $this->extractMoney($qLower) ?? 0.0;
            $top = $this->extractTopN($qLower) ?? 10;

            $today = now()->toDateString();

            $invoices = collect($data['invoices'] ?? [])
                ->filter(fn ($i) => (($i['status'] ?? '') === 'unpaid'))
                ->when($isOverdueQuery, fn ($c) => $c->filter(fn ($i) => ($i['due_date'] ?? '9999-12-31') < $today))
                ->filter(fn ($i) => (float)($i['total'] ?? 0) >= $min)
                ->sortByDesc('total')
                ->take($top)
                ->values();

            if ($invoices->isEmpty()) {
                $suffix = $isOverdueQuery ? "overdue " : "";
                return ["No {$suffix}unpaid invoices found above RM " . number_format($min, 2) . ".", 'invoices_none'];
            }

            $lines = $invoices->map(function ($i) {
                $no = $i['no'] ?? '-';
                $cust = $i['customer'] ?? '-';
                $total = number_format((float)($i['total'] ?? 0), 2);
                $due = $i['due_date'] ?? '-';
                return "{$no} — {$cust} — RM {$total} (due {$due})";
            });

            $title = $isOverdueQuery
                ? "Top overdue unpaid invoices"
                : "Top unpaid invoices";

            return [
                "{$title} >= RM " . number_format($min, 2) . ":\n" . $lines->implode("\n"),
                'invoices_list'
            ];
        }

        // Special: “who is overdue” without invoice keyword
        if ($isOverdueQuery && !$isInvoiceQuery) {
            $today = now()->toDateString();

            $overdue = collect($data['invoices'] ?? [])
                ->filter(fn ($i) => (($i['status'] ?? '') === 'unpaid'))
                ->filter(fn ($i) => ($i['due_date'] ?? '9999-12-31') < $today);

            if ($overdue->isEmpty()) return ["No overdue unpaid invoices found.", 'overdue_none'];

            $byCustomer = $overdue
                ->groupBy('customer')
                ->map(fn ($rows) => $rows->sum(fn ($r) => (float)($r['total'] ?? 0)))
                ->sortDesc();

            $lines = $byCustomer
                ->map(fn ($sum, $cust) => "{$cust}: RM " . number_format($sum, 2))
                ->values();

            return ["Overdue customers (unpaid total):\n" . $lines->implode("\n"), 'overdue_customers'];
        }

        // ─────────────────────────────────────────────
        // 2) Low stock / reorder
        // Supports:
        // - "low stock"
        // - "below reorder point"
        // - "suggest reorder qty"
        // ─────────────────────────────────────────────
        if ($hasAny(['low stock', 'low-stock', 'reorder point', 'reorder', 'below reorder'])) {
            $items = collect($data['stock_items'] ?? [])
                ->filter(fn ($i) => (int)($i['qty'] ?? 0) < (int)($i['reorder_point'] ?? 0))
                ->values();

            if ($items->isEmpty()) return ["No items are below reorder point.", 'stock_none'];

            $lines = $items->map(function ($i) {
                $sku = $i['sku'] ?? '-';
                $name = $i['name'] ?? '-';
                $qty = (int)($i['qty'] ?? 0);
                $rp = (int)($i['reorder_point'] ?? 0);

                // Suggest reorder to reach 2x RP (simple demo rule)
                $suggest = max(0, ($rp * 2) - $qty);

                return "{$sku} — {$name} | qty {$qty} / rp {$rp} | suggest reorder {$suggest}";
            });

            return ["Low-stock items below reorder point:\n" . $lines->implode("\n"), 'stock_low'];
        }

        // ─────────────────────────────────────────────
        // 3) Production delays
        // Supports:
        // - "production delay"
        // - "delayed jobs"
        // ─────────────────────────────────────────────
        if ($hasAny(['production delay', 'production delays', 'delayed job', 'delayed jobs', 'delay today', 'production delayed'])) {
            $jobs = collect($data['production'] ?? [])
                ->filter(fn ($j) => ($j['status'] ?? '') === 'delayed')
                ->values();

            if ($jobs->isEmpty()) return ["No production delays recorded.", 'production_none'];

            $lines = $jobs->map(function ($j) {
                $job = $j['job'] ?? '-';
                $title = $j['title'] ?? '-';
                $due = $j['due_date'] ?? '-';
                $reason = $j['reason'] ?? '-';
                return "{$job} — {$title} (due {$due}) — {$reason}";
            });

            return ["Production delays:\n" . $lines->implode("\n"), 'production_delays'];
        }

        // ─────────────────────────────────────────────
        // 4) Workflow / approval flow
        // Supports:
        // - "approval flow"
        // - "workflow rule"
        // ─────────────────────────────────────────────
        if ($hasAny(['approval', 'approval flow', 'workflow', 'rule'])) {
            $wf = collect($data['workflows'] ?? [])->first();
            if (!$wf) return [null, 'workflow_none'];

            $rule = $wf['rule'] ?? null;
            return [$rule ? "Workflow rule:\n- {$rule}" : null, 'workflow_rule'];
        }

        return [null, 'no_match'];
    }

    private function extractMoney(string $qLower): ?float
    {
        // rm 10k / rm10k / rm 20000 / 10000
        if (preg_match('/rm\s*([\d\.]+)\s*(k)?/i', $qLower, $m)) {
            $num = (float) $m[1];
            $isK = !empty($m[2]);
            return $isK ? $num * 1000 : $num;
        }

        if (preg_match('/\b(\d{4,})\b/', $qLower, $m)) {
            return (float) $m[1];
        }

        return null;
    }

    private function extractTopN(string $qLower): ?int
    {
        // "top 5", "top10"
        if (preg_match('/top\s*(\d{1,3})/i', $qLower, $m)) {
            $n = (int) $m[1];
            return ($n > 0 && $n <= 100) ? $n : null;
        }
        return null;
    }
}
