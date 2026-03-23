"""
verify_visualization.py
========================
Computes the exact same metrics the D3 index.html computes in JavaScript,
so you can cross-check every number on the page.

Usage:
    python verify_visualization.py

Make sure data/filtered_data.csv exists (run data_cleaning.py first).
"""

import pandas as pd
import numpy as np

# ── Load data exactly as the JS does ──
df = pd.read_csv(
    'data/filtered_data.csv',
    low_memory=False,
    na_values=['PS', '', 'NULL', 'PrivacySuppressed']
)

# Convert all columns we use to numeric
num_cols = [
    'PREDDEG', 'CONTROL', 'HBCU', 'UGDS',
    'GRAD_DEBT_MDN', 'DEBT_MDN',
    'FEMALE_DEBT_MDN', 'MALE_DEBT_MDN',
    'LO_INC_DEBT_MDN', 'MD_INC_DEBT_MDN', 'HI_INC_DEBT_MDN',
    'FIRSTGEN_DEBT_MDN',
    'UGDS_BLACK', 'UGDS_WHITE', 'UGDS_HISP',
]

# Earnings columns: P6 through P10 for overall, male, female
for yr in range(6, 11):
    num_cols.append(f'MD_EARN_WNE_P{yr}')
    num_cols.append(f'MD_EARN_WNE_MALE1_P{yr}')  # male
    num_cols.append(f'MD_EARN_WNE_MALE0_P{yr}')  # female

# Completion columns
for race in ['WHITE', 'BLACK', 'HISP', 'ASIAN', 'AIAN', 'NHPI', '2MOR']:
    num_cols.append(f'C150_4_{race}')
num_cols.append('C150_4')

# Also check 1-year earnings if present
if 'MD_EARN_WNE_1YR' in df.columns:
    num_cols.append('MD_EARN_WNE_1YR')

for col in num_cols:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')

# ── Define subsets (same logic as JS) ──
cc       = df[df['PREDDEG'] == 2]
four_yr  = df[df['PREDDEG'] == 3]
pub4     = df[(df['CONTROL'] == 1) & (df['PREDDEG'] == 3)]
priv4    = df[(df['CONTROL'] == 2) & (df['PREDDEG'] == 3)]
fp4      = df[(df['CONTROL'] == 3) & (df['PREDDEG'] == 3)]
hbcus    = df[df['HBCU'] == 1]

print("=" * 70)
print("VERIFICATION: The Diploma Divide — D3 Visualization Data")
print("=" * 70)
print(f"Total rows in filtered_data.csv: {len(df)}")
print(f"  Community colleges (PREDDEG=2): {len(cc)}")
print(f"  4-year institutions (PREDDEG=3): {len(four_yr)}")
print(f"  Public 4-year: {len(pub4)}")
print(f"  Private nonprofit 4-year: {len(priv4)}")
print(f"  Private for-profit 4-year: {len(fp4)}")
print(f"  HBCUs: {len(hbcus)}")

# ══════════════════════════════════════════════════════════════════
# SECTION 1: Institution Type — Debt vs Earnings (Grouped + Ratio)
# JS: median(GRAD_DEBT_MDN) and median(MD_EARN_WNE_P6) per group
# ══════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("SECTION 1: Promise vs. Reality — Debt vs Earnings by Institution Type")
print("=" * 70)
print(f"{'Type':<25} {'Median Debt':>12} {'Median Earn (6yr)':>18} {'Ratio':>8}")
print("-" * 70)

sec1_groups = [
    ('Community College',  cc),
    ('Public 4-Year',      pub4),
    ('Private Nonprofit',  priv4),
    ('Private For-Profit', fp4),
    ('HBCU',               hbcus),
]

for label, subset in sec1_groups:
    debt = subset['GRAD_DEBT_MDN'].median()
    earn = subset['MD_EARN_WNE_P6'].median()
    ratio = debt / earn if pd.notna(earn) and earn > 0 else float('nan')
    debt_str = f"${debt:,.0f}" if pd.notna(debt) else "N/A"
    earn_str = f"${earn:,.0f}" if pd.notna(earn) else "N/A"
    ratio_str = f"{ratio:.0%}" if pd.notna(ratio) else "N/A"
    n_debt = subset['GRAD_DEBT_MDN'].notna().sum()
    n_earn = subset['MD_EARN_WNE_P6'].notna().sum()
    print(f"{label:<25} {debt_str:>12} {earn_str:>18} {ratio_str:>8}  (n_debt={n_debt}, n_earn={n_earn})")

print("\n→ Compare these against the grouped bars and ratio bars on the page.")

# ══════════════════════════════════════════════════════════════════
# SECTION 2: Gender Earnings Over Time
# JS: median(MD_EARN_WNE_MALE1_P{yr}) and median(MD_EARN_WNE_MALE0_P{yr})
#     across ALL institutions, for yr = 6..10
# ══════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("SECTION 2: The Widening Gap — Gender Earnings 6-10 Years Post-Entry")
print("=" * 70)
print(f"{'Year':>6} {'Male Median':>14} {'Female Median':>16} {'Gap':>10} {'F per $1 M':>12}")
print("-" * 70)

for yr in range(6, 11):
    mcol = f'MD_EARN_WNE_MALE1_P{yr}'
    fcol = f'MD_EARN_WNE_MALE0_P{yr}'
    if mcol in df.columns and fcol in df.columns:
        male_med = df[mcol].median()
        female_med = df[fcol].median()
        gap = male_med - female_med if pd.notna(male_med) and pd.notna(female_med) else float('nan')
        ratio = female_med / male_med if pd.notna(male_med) and male_med > 0 else float('nan')
        n_m = df[mcol].notna().sum()
        n_f = df[fcol].notna().sum()
        m_str = f"${male_med:,.0f}" if pd.notna(male_med) else "N/A"
        f_str = f"${female_med:,.0f}" if pd.notna(female_med) else "N/A"
        g_str = f"${gap:,.0f}" if pd.notna(gap) else "N/A"
        r_str = f"${ratio:.2f}" if pd.notna(ratio) else "N/A"
        print(f"P{yr:>4} {m_str:>14} {f_str:>16} {g_str:>10} {r_str:>12}  (n_m={n_m}, n_f={n_f})")
    else:
        print(f"P{yr:>4}  — columns not found in dataset")

print("\n→ Compare male/female lines and gap annotation on the page.")
print("  Toggle to ratio view and check the cents-per-dollar values.")

# ══════════════════════════════════════════════════════════════════
# SECTION 3: Completion Rates by Race
# JS: median(C150_4_{RACE}) across 4-year institutions (PREDDEG=3)
# ══════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("SECTION 3: Crossing the Finish Line — 150% Completion by Race")
print("=" * 70)
print(f"{'Race':<12} {'Median Rate':>12} {'N valid':>10}")
print("-" * 40)

race_cols = [
    ('White',    'C150_4_WHITE'),
    ('Black',    'C150_4_BLACK'),
    ('Hispanic', 'C150_4_HISP'),
    ('Asian',    'C150_4_ASIAN'),
    ('AIAN',     'C150_4_AIAN'),
    ('NHPI',     'C150_4_NHPI'),
    ('Two+',     'C150_4_2MOR'),
]

for label, col in race_cols:
    if col in four_yr.columns:
        vals = four_yr[col].dropna()
        med = vals.median()
        r_str = f"{med:.1%}" if pd.notna(med) else "N/A"
        print(f"{label:<12} {r_str:>12} {len(vals):>10}")
    else:
        print(f"{label:<12}  — column {col} not found")

print("\n→ Compare each bar height and label on the page.")

# ══════════════════════════════════════════════════════════════════
# SECTION 4: Racetrack — Estimated Years to Repay
# JS: median(debt_col) / (median(MD_EARN_WNE_P6) * 0.10) for each group
# ══════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("SECTION 4: Hurdle Race — Est. Years to Repay (10% of earnings)")
print("=" * 70)

earn_p6_all = df['MD_EARN_WNE_P6'].median()
print(f"Overall median earnings (P6): ${earn_p6_all:,.0f}" if pd.notna(earn_p6_all) else "Overall median earnings: N/A")
print()
print(f"{'Group':<18} {'Median Debt':>12} {'Earn (P6)':>12} {'Est Years':>10}")
print("-" * 58)

race_groups = [
    ('High Income',   'HI_INC_DEBT_MDN'),
    ('Middle Income',  'MD_INC_DEBT_MDN'),
    ('Low Income',     'LO_INC_DEBT_MDN'),
    ('First-Gen',      'FIRSTGEN_DEBT_MDN'),
]

for label, col in race_groups:
    if col in df.columns:
        debt_med = df[col].median()
        # JS uses median of all rows' P6 earnings as denominator
        years = debt_med / (earn_p6_all * 0.10) if pd.notna(debt_med) and pd.notna(earn_p6_all) and earn_p6_all > 0 else float('nan')
        d_str = f"${debt_med:,.0f}" if pd.notna(debt_med) else "N/A"
        e_str = f"${earn_p6_all:,.0f}" if pd.notna(earn_p6_all) else "N/A"
        y_str = f"~{years:.1f}" if pd.notna(years) else "N/A"
        n = df[col].notna().sum()
        print(f"{label:<18} {d_str:>12} {e_str:>12} {y_str:>10}  (n={n})")
    else:
        print(f"{label:<18}  — column {col} not found")

print("\n→ Compare car positions and hover tooltips on the page.")

# ══════════════════════════════════════════════════════════════════
# SECTION 5: Beeswarm — Institution-Level Debt/Earnings Ratios
# JS: GRAD_DEBT_MDN / MD_EARN_WNE_P6 per institution, filtered to ratio < 3
# ══════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("SECTION 5: Beeswarm — Institution-Level Debt-to-Earnings Ratios")
print("=" * 70)

bee = df.dropna(subset=['GRAD_DEBT_MDN', 'MD_EARN_WNE_P6', 'UGDS'])
bee = bee[bee['MD_EARN_WNE_P6'] > 0]
bee = bee[bee['UGDS'] > 0]
bee['ratio'] = bee['GRAD_DEBT_MDN'] / bee['MD_EARN_WNE_P6']
bee_filtered = bee[bee['ratio'] < 3]

print(f"Institutions with valid debt, earnings, and enrollment: {len(bee)}")
print(f"After filtering ratio < 3: {len(bee_filtered)}")
print()

# Breakdown by type
type_map = {1: 'Public', 2: 'Private Nonprofit', 3: 'For-Profit'}
for ctrl, label in type_map.items():
    subset = bee_filtered[bee_filtered['CONTROL'] == ctrl]
    med_ratio = subset['ratio'].median()
    print(f"  {label}: {len(subset)} institutions, median ratio = {med_ratio:.0%}" if pd.notna(med_ratio) else f"  {label}: {len(subset)} institutions")

hbcu_bee = bee_filtered[bee_filtered['HBCU'] == 1]
hbcu_ratio = hbcu_bee['ratio'].median()
print(f"  HBCU: {len(hbcu_bee)} institutions, median ratio = {hbcu_ratio:.0%}" if pd.notna(hbcu_ratio) else f"  HBCU: {len(hbcu_bee)} institutions")

# Sample some known schools for spot-checking
print("\n── Spot-check: 10 sample institutions ──")
print(f"{'Institution':<45} {'Debt':>8} {'Earn':>8} {'Ratio':>7}")
print("-" * 72)
sample = bee_filtered.sample(n=min(10, len(bee_filtered)), random_state=42)
for _, row in sample.iterrows():
    name = str(row['INSTNM'])[:44]
    print(f"{name:<45} ${row['GRAD_DEBT_MDN']:>7,.0f} ${row['MD_EARN_WNE_P6']:>7,.0f} {row['ratio']:>6.0%}")

print("\n→ Hover these institutions in the beeswarm on the page to verify.")
print("  The name, debt, earnings, and ratio should match exactly.")

# ══════════════════════════════════════════════════════════════════
# CALLOUT TEXT VERIFICATION
# ══════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("CALLOUT TEXT VERIFICATION")
print("=" * 70)

# Callout 1
priv_debt = priv4['GRAD_DEBT_MDN'].median()
priv_earn = priv4['MD_EARN_WNE_P6'].median()
pub_debt = pub4['GRAD_DEBT_MDN'].median()
pub_earn = pub4['MD_EARN_WNE_P6'].median()
print(f"\nCallout 1 should read:")
print(f"  Private nonprofit: debt ${priv_debt:,.0f}, earn ${priv_earn:,.0f}")
print(f"  Public 4-year: debt ${pub_debt:,.0f}, earn ${pub_earn:,.0f}")

# Callout 2
if 'MD_EARN_WNE_MALE1_P10' in df.columns and 'MD_EARN_WNE_MALE0_P10' in df.columns:
    m10 = df['MD_EARN_WNE_MALE1_P10'].median()
    f10 = df['MD_EARN_WNE_MALE0_P10'].median()
    # Find the last year with valid data
    last_yr = None
    for yr in range(10, 5, -1):
        mc = f'MD_EARN_WNE_MALE1_P{yr}'
        fc = f'MD_EARN_WNE_MALE0_P{yr}'
        if mc in df.columns and fc in df.columns:
            mv = df[mc].median()
            fv = df[fc].median()
            if pd.notna(mv) and pd.notna(fv):
                last_yr = yr
                break
    if last_yr:
        mv = df[f'MD_EARN_WNE_MALE1_P{last_yr}'].median()
        fv = df[f'MD_EARN_WNE_MALE0_P{last_yr}'].median()
        print(f"\nCallout 2 should read:")
        print(f"  By {last_yr} years: women ~${fv:,.0f} vs men ~${mv:,.0f}")
        print(f"  Ratio: ${fv/mv:.2f} per dollar")

# Callout 3
comp_data = []
for label, col in race_cols:
    if col in four_yr.columns:
        med = four_yr[col].median()
        if pd.notna(med):
            comp_data.append((label, med))
if comp_data:
    best = max(comp_data, key=lambda x: x[1])
    worst = min(comp_data, key=lambda x: x[1])
    print(f"\nCallout 3 should read:")
    print(f"  {best[0]} students complete at ~{best[1]:.1%}")
    print(f"  {worst[0]} students complete at ~{worst[1]:.1%}")

# Callout 4
if pd.notna(earn_p6_all) and earn_p6_all > 0:
    fastest = None
    slowest = None
    for label, col in race_groups:
        if col in df.columns:
            d = df[col].median()
            if pd.notna(d):
                yrs = d / (earn_p6_all * 0.10)
                if fastest is None or yrs < fastest[1]:
                    fastest = (label, yrs)
                if slowest is None or yrs > slowest[1]:
                    slowest = (label, yrs)
    if fastest and slowest:
        print(f"\nCallout 4 should read:")
        print(f"  {fastest[0]}: ~{fastest[1]:.0f} years")
        print(f"  {slowest[0]}: ~{slowest[1]:.0f} years")

# Callout 5
print(f"\nCallout 5 should read:")
print(f"  Showing {len(bee_filtered)} institutions:")
for ctrl, label in type_map.items():
    n = len(bee_filtered[bee_filtered['CONTROL'] == ctrl])
    print(f"    {n} {label.lower()}")
print(f"    {len(bee_filtered[bee_filtered['HBCU'] == 1])} HBCUs")

print("\n" + "=" * 70)
print("DONE. Compare every number above against the live page.")
print("=" * 70)