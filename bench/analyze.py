"""
Summarise a benchmark run: medians / IQR per implementation x page x network,
relative differences, and report-ready charts (PNG).

Usage: python3 bench/analyze.py bench/results/<run-folder>
Output (inside the run folder): summary.csv, summary.json, charts/*.png
"""
import csv
import json
import statistics as st
import sys
from collections import defaultdict
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

RUN = Path(sys.argv[1])
rows = [r for r in csv.DictReader(open(RUN / "results.csv")) if not r["runtime_error"]]
errors = [r for r in csv.DictReader(open(RUN / "results.csv")) if r["runtime_error"]]

METRICS = ["fcp_ms", "lcp_ms", "tti_ms", "tbt_ms", "si_ms", "cls", "perf_score",
           "js_transfer_kb", "js_requests", "requests", "total_transfer_kb"]
IMPLS = sorted({r["impl"] for r in rows})
PAGES = ["home", "plp", "pdp", "cart"]
NETS = ["slow-3g", "fast-4g", "broadband"]
LABEL = {"A": "A: Module Federation", "B": "B: Single-SPA", "C": "C: Next.js RSC"}
PAGE_LABEL = {"home": "Home", "plp": "Listing", "pdp": "Detail", "cart": "Cart"}
NET_LABEL = {"slow-3g": "Slow 3G", "fast-4g": "Fast 4G", "broadband": "Broadband"}
COLOR = {"A": "#2a78d6", "B": "#eb6834", "C": "#1baf7a"}  # validated categorical order

groups = defaultdict(list)
for r in rows:
    groups[(r["impl"], r["page"], r["network"])].append(r)


def q(vals, p):
    vals = sorted(vals)
    k = (len(vals) - 1) * p
    f, c = int(k), min(int(k) + 1, len(vals) - 1)
    return vals[f] + (vals[c] - vals[f]) * (k - f)


summary = []
for (impl, page, net), rs in sorted(groups.items()):
    out = {"impl": impl, "page": page, "network": net, "n": len(rs)}
    for m in METRICS:
        vals = [float(r[m]) for r in rs if r[m] != ""]
        if not vals:
            continue
        out[f"{m}_median"] = round(st.median(vals), 4 if m == "cls" else 1)
        out[f"{m}_iqr"] = round(q(vals, 0.75) - q(vals, 0.25), 4 if m == "cls" else 1)
        out[f"{m}_min"] = round(min(vals), 4 if m == "cls" else 1)
        out[f"{m}_max"] = round(max(vals), 4 if m == "cls" else 1)
    out["lcp_element"] = st.mode([r["lcp_element"] for r in rs])
    summary.append(out)

with open(RUN / "summary.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=sorted({k for s in summary for k in s}, key=lambda k: (k not in ("impl", "page", "network", "n"), k)))
    w.writeheader()
    w.writerows(summary)

S = {(s["impl"], s["page"], s["network"]): s for s in summary}

# Aggregate: median over pages of the per-page medians, per impl x network.
agg = {}
for impl in IMPLS:
    for net in NETS:
        for m in METRICS:
            vals = [S[(impl, p, net)][f"{m}_median"] for p in PAGES if (impl, p, net) in S and f"{m}_median" in S[(impl, p, net)]]
            if vals:
                agg[f"{impl}|{net}|{m}"] = round(st.mean(vals), 4 if m == "cls" else 1)

json.dump({"summary": summary, "aggregate_mean_of_page_medians": agg, "n_ok": len(rows), "n_errors": len(errors),
           "errors": [{k: e[k] for k in ("impl", "page", "network", "run", "runtime_error")} for e in errors]},
          open(RUN / "summary.json", "w"), indent=1)

# ------------------------------------------------------------------ charts
plt.rcParams.update({
    "font.family": "DejaVu Serif", "font.size": 9, "axes.edgecolor": "#8a8984", "axes.linewidth": 0.6,
    "axes.spines.top": False, "axes.spines.right": False, "axes.grid": True, "grid.color": "#e6e5e0",
    "grid.linewidth": 0.6, "axes.axisbelow": True, "axes.titlesize": 10, "figure.dpi": 200,
    "xtick.color": "#52514e", "ytick.color": "#52514e", "axes.labelcolor": "#52514e",
})
charts = RUN / "charts"
charts.mkdir(exist_ok=True)


def grouped(metric, ylabel, title, fname, scale=1.0, fmt="{:.0f}"):
    """Small multiples: one panel per network, pages on x, one bar per implementation."""
    fig, axes = plt.subplots(1, 3, figsize=(7.2, 2.6), sharey=False)
    width = 0.8 / len(IMPLS)
    for ax, net in zip(axes, NETS):
        for i, impl in enumerate(IMPLS):
            xs, ys, lo, hi = [], [], [], []
            for j, p in enumerate(PAGES):
                s = S.get((impl, p, net))
                if not s or f"{metric}_median" not in s:
                    continue
                med = s[f"{metric}_median"] * scale
                xs.append(j - 0.4 + width * (i + 0.5))
                ys.append(med)
                lo.append(med - s[f"{metric}_min"] * scale)
                hi.append(s[f"{metric}_max"] * scale - med)
            ax.bar(xs, ys, width=width - 0.04, color=COLOR[impl], label=LABEL[impl], edgecolor="white", linewidth=0.8)
            if any(lo) or any(hi):
                ax.errorbar(xs, ys, yerr=[lo, hi], fmt="none", ecolor="#52514e", elinewidth=0.6, capsize=1.5)
        ax.set_xticks(range(len(PAGES)))
        ax.set_xticklabels([PAGE_LABEL[p] for p in PAGES])
        ax.set_title(NET_LABEL[net])
        ax.grid(axis="x", visible=False)
    axes[0].set_ylabel(ylabel)
    handles, labels = axes[0].get_legend_handles_labels()
    fig.legend(handles, labels, loc="lower center", ncol=len(IMPLS), frameon=False, bbox_to_anchor=(0.5, -0.02))
    fig.suptitle(title, fontsize=10, y=1.0)
    fig.tight_layout(rect=(0, 0.07, 1, 0.97))
    fig.savefig(charts / fname, bbox_inches="tight")
    plt.close(fig)


grouped("lcp_ms", "LCP (s)", "Largest Contentful Paint (single run)", "lcp.png", scale=1 / 1000)
grouped("fcp_ms", "FCP (s)", "First Contentful Paint (single run)", "fcp.png", scale=1 / 1000)
grouped("tti_ms", "TTI (s)", "Time to Interactive (single run)", "tti.png", scale=1 / 1000)
grouped("tbt_ms", "TBT (ms)", "Total Blocking Time (single run)", "tbt.png")

# JavaScript transferred per page (network-independent; broadband runs)
fig, ax = plt.subplots(figsize=(5.2, 2.6))
width = 0.8 / len(IMPLS)
for i, impl in enumerate(IMPLS):
    xs = [j - 0.4 + width * (i + 0.5) for j in range(len(PAGES))]
    ys = [S[(impl, p, "broadband")]["js_transfer_kb_median"] for p in PAGES]
    bars = ax.bar(xs, ys, width=width - 0.04, color=COLOR[impl], label=LABEL[impl], edgecolor="white", linewidth=0.8)
    for x, y in zip(xs, ys):
        ax.text(x, y + 1.5, f"{y:.0f}", ha="center", va="bottom", fontsize=7, color="#52514e")
ax.set_xticks(range(len(PAGES)))
ax.set_xticklabels([PAGE_LABEL[p] for p in PAGES])
ax.set_ylabel("JavaScript transferred (KB, gzip)")
ax.set_title("JavaScript downloaded per page (cold cache)")
ax.grid(axis="x", visible=False)
ax.legend(frameon=False, loc="upper center", bbox_to_anchor=(0.5, -0.12), ncol=len(IMPLS))
fig.tight_layout()
fig.savefig(charts / "js_kb.png", bbox_inches="tight")
plt.close(fig)

print(f"ok rows={len(rows)} errors={len(errors)} -> {RUN}/summary.csv, charts/")
