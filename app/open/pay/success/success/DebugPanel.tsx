"use client";

type DebugPanelProps = {
  open: boolean;
  snapshot: unknown | null;
  onToggle: () => void;
};

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return JSON.stringify(
      { ok: false, error: "Failed to stringify snapshot" },
      null,
      2
    );
  }
}

type JsonToken = { text: string; cls?: string };

function tokenizeJson(json: string): JsonToken[] {
  // Matches:
  // 1) "key":       (group1 = key)
  // 2) "string"     (group2 = string)
  // 3) number       (group3)
  // 4) true|false   (group4)
  // 5) null         (group5)
  const re =
    /"([^"\\]*(?:\\.[^"\\]*)*)"\s*:|"([^"\\]*(?:\\.[^"\\]*)*)"|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false)\b|\b(null)\b/g;

  const out: JsonToken[] = [];
  let last = 0;

  for (;;) {
    const m = re.exec(json);
    if (!m) break;

    if (m.index > last) out.push({ text: json.slice(last, m.index) });

    // key
    if (m[1] !== undefined) {
      out.push({ text: `"${m[1]}"`, cls: "text-sky-300" }); // keys: blue/cyan
      out.push({ text: ":" });
    }
    // string value
    else if (m[2] !== undefined) {
      out.push({ text: `"${m[2]}"`, cls: "text-emerald-300" }); // strings: green
    }
    // number
    else if (m[3] !== undefined) {
      out.push({ text: m[3], cls: "text-amber-300" }); // numbers: yellow
    }
    // boolean
    else if (m[4] !== undefined) {
      out.push({ text: m[4], cls: "text-violet-300" });
    }
    // null
    else if (m[5] !== undefined) {
      out.push({ text: m[5], cls: "text-slate-400" }); // null: gray
    }

    last = re.lastIndex;
  }

  if (last < json.length) out.push({ text: json.slice(last) });

  return out;
}

function JsonPretty({ value }: { value: unknown }) {
  const json = safeJson(value);
  const tokens = tokenizeJson(json);

  return (
    <pre
      className={[
        "relative",
        "max-w-full",
        // mobile first: safer height and wrap
        "max-h-[60vh] sm:max-h-420px",
        "overflow-x-auto overflow-y-auto",
        "rounded-xl",
        "bg-slate-900",
        "p-3",
        "text-[11px] leading-5",
        "text-slate-100",
        "whitespace-pre-wrap sm:whitespace-pre",
      ].join(" ")}
    >
      <code>
        {tokens.map((t, i) => (
          <span key={i} className={t.cls ?? ""}>
            {t.text}
          </span>
        ))}
      </code>
    </pre>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={[
        "h-4 w-4",
        "text-slate-500",
        "transition-transform duration-200",
        open ? "rotate-180" : "rotate-0",
      ].join(" ")}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 8l5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DebugPanel({ open, snapshot, onToggle }: DebugPanelProps) {
  const copy = async () => {
    const text = safeJson(snapshot ?? { ok: false, error: "No snapshot yet" });
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // silent: no console spam
    }
  };

  return (
    <section className="mt-6 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={[
          "w-full",
          "flex items-center justify-between gap-4",
          "px-4 py-4",
          "text-left",
          "transition",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:ring-offset-2",
          open ? "bg-slate-50" : "bg-white hover:bg-slate-50",
        ].join(" ")}
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">
            Payment details (technical)
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">
            Includes txHash, wallet, AML &amp; full provider response
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={[
              "shrink-0",
              "inline-flex items-center",
              "rounded-full",
              "px-3 py-1",
              "text-xs font-semibold",
              "border",
              "transition",
              open
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-900 border-slate-200 hover:border-slate-300",
            ].join(" ")}
          >
            {open ? "Hide" : "Show"}
          </span>
          <Chevron open={open} />
        </div>
      </button>

      {open ? (
        <div className="min-w-0 px-4 pb-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xs font-semibold tracking-wide text-slate-600">
                RAW INVOICE (ALL FIELDS)
              </h3>
              <div className="mt-0.5 text-[11px] text-slate-500">
                {snapshot ? "live" : "—"}
              </div>
            </div>

            <button
              type="button"
              onClick={copy}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-900 hover:border-slate-300"
            >
              Copy JSON
            </button>
          </div>

          <JsonPretty
            value={snapshot ?? { ok: false, error: "No snapshot yet" }}
          />
        </div>
      ) : null}
    </section>
  );
}
