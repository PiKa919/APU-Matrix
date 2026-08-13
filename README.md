# ⚡ APU Matrix

> **Phone Performance vs. Price Reality Check.**  
> *Because spending \$1,200 on a phone just to scroll Instagram shouldn't require a degree in SoC microarchitecture.*

---

## 🧐 What Else Exists in the Market?

When you try to pick your next smartphone today, you're usually met with:

1. **TechTubers Reading Spec Sheets**  
   15-minute videos screaming *"THIS CHANGES EVERYTHING!"* while literally reciting the GSMArena specs page back to you.
2. **Raw Benchmark Sites in a Vacuum**  
   Sites showing a 5% higher Geekbench score on a top bar graph without mentioning the phone costs 3x more.
3. **Ecommerce Buzzwords**  
   Listings hiding mid-range chipsets under *"Ultra Deca-Core Turbo Speed Max"* branding.

---

## 💡 What APU Matrix Does Differently

**APU Matrix** maps **real market pricing** directly against **verified raw performance metrics** on interactive scatter plots.

```
       High Performance │                      [ Flagship Value ]
                        │                      * Phone A (INR 45,000)
                        │             * Phone B (INR 85,000)
                        │    [ Overpriced ]
        Low Performance └─────────────────────────────────────────
                          Low Price                     High Price
```

- 📊 **Price-vs-Performance Scatter Plots**: Visually pinpoint which phones deliver peak hardware value vs overpriced hype.
- ⚡ **Multi-Metric Normalization**: Geekbench 6 (Single/Multi), Geekbench AI (Quantized), and AnTuTu GPU/CPU scores.
- 🎨 **APU Lattice Canvas**: Interactive 3D WebGL SoC visualization hero banner.
- 🎯 **No-BS Filtering**: Filter by processor family (Snapdragon, Dimensity, Exynos), price tier, and phone generation.

---

## 🖼️ Dashboard Preview

![APU Matrix Dashboard](./public/images/dashboard-preview.png)

> 💡 **Tip for Contributors**: Drop a screenshot or demo GIF at `public/images/dashboard-preview.png` to display your UI preview here!

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Run dev server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Built With

- **Framework**: Next.js 16 (App Router) + React 19
- **Charts**: TanStack Charts & D3
- **3D Hero**: Three.js / WebGL
- **Styling**: Tailwind CSS v4 + Lucide Icons
- **Analytics**: Vercel Analytics & Speed Insights
