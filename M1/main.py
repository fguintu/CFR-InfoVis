import pandas as pd
import numpy as np

# Read CSV and treat 'PS' and empty strings as NaN
df = pd.read_csv('filtered_data.csv', low_memory=False, na_values=['PS', '', 'NULL', 'PrivacySuppressed'])

# Convert key columns to numeric
numeric_cols = ['DEBT_MDN', 'GRAD_DEBT_MDN', 'WDRAW_DEBT_MDN', 'FEMALE_DEBT_MDN', 'MALE_DEBT_MDN',
                'PREDDEG', 'CONTROL', 'HBCU', 'UGDS_BLACK', 'UGDS_WHITE', 'UGDS_HISP',
                'UGDS_WOMEN', 'UGDS_MEN', 'MD_EARN_WNE_P6', 'MD_EARN_WNE_1YR',
                'MD_EARN_WNE_MALE0_P6', 'MD_EARN_WNE_MALE1_P6']

for col in numeric_cols:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')

# Define institution types
# PREDDEG: 1=Certificate, 2=Associate's (Community College), 3=Bachelor's, 4=Graduate
community_colleges = df[df['PREDDEG'] == 2]
four_year = df[df['PREDDEG'] == 3]

# CONTROL: 1=Public, 2=Private nonprofit, 3=Private for-profit
public_institutions = df[df['CONTROL'] == 1]
private_institutions = df[df['CONTROL'].isin([2, 3])]
public_4yr = df[(df['CONTROL'] == 1) & (df['PREDDEG'] == 3)]

# HBCUs and PWIs
hbcus = df[df['HBCU'] == 1]
pwis = df[(df['HBCU'] == 0) | (df['HBCU'].isna())]

print("=" * 60)
print("COLLEGE SCORECARD ANALYSIS RESULTS")
print("=" * 60)

# 1. Median debt of community college students
cc_median_debt = community_colleges['GRAD_DEBT_MDN'].median()
print(f"\n1. Median debt of community college graduates: ${cc_median_debt:,.0f}")

# 2. Average salary first year after graduating community college
cc_avg_salary_1yr = community_colleges['MD_EARN_WNE_1YR'].mean()
print(f"2. Avg salary 1yr after community college: ${cc_avg_salary_1yr:,.0f}")

# 3. Average debt of graduates from private institutions
private_avg_debt = private_institutions['GRAD_DEBT_MDN'].mean()
print(f"3. Avg graduate debt (private institutions): ${private_avg_debt:,.0f}")

# 4 & 5. Estimates for Black women at public universities
# NOTE: No race+gender intersection data available; using high-Black enrollment schools
high_black_public = public_4yr[public_4yr['UGDS_BLACK'] >= 0.4]
black_women_debt_est = high_black_public['FEMALE_DEBT_MDN'].mean()
black_women_salary_est = high_black_public['MD_EARN_WNE_1YR'].mean()
print(f"\n4. Est. avg debt Black women at public unis: ${black_women_debt_est:,.0f}")
print(f"   (Based on {len(high_black_public)} public 4-yr schools with ≥40% Black enrollment)")
print(f"5. Est. avg salary Black women (public unis): ${black_women_salary_est:,.0f}")

# 6 & 7. Estimates for White men at public universities
high_white_public = public_4yr[public_4yr['UGDS_WHITE'] >= 0.7]
white_men_debt_est = high_white_public['MALE_DEBT_MDN'].mean()
white_men_salary_est = high_white_public['MD_EARN_WNE_1YR'].mean()
print(f"\n6. Est. avg debt White men at public unis: ${white_men_debt_est:,.0f}")
print(f"   (Based on {len(high_white_public)} public 4-yr schools with ≥70% White enrollment)")
print(f"7. Est. avg salary White men (public unis): ${white_men_salary_est:,.0f}")

# 8. Median debt at HBCUs
hbcu_median_debt = hbcus['GRAD_DEBT_MDN'].median()
print(f"\n8. Median debt at HBCUs: ${hbcu_median_debt:,.0f}")

# 9. Female to male salary ratio (cents per dollar)
# Using gender-specific earnings columns
female_earnings = df['MD_EARN_WNE_MALE0_P6'].mean()  # MALE0 = female
male_earnings = df['MD_EARN_WNE_MALE1_P6'].mean()    # MALE1 = male
ratio_cents = (female_earnings / male_earnings) * 100
print(f"\n9. Female:Male salary ratio: {ratio_cents:.1f} cents per dollar")
print(f"   (Female avg: ${female_earnings:,.0f}, Male avg: ${male_earnings:,.0f})")

# 10 & 11. Women at public/state universities
women_public_debt = public_4yr['FEMALE_DEBT_MDN'].mean()
women_public_salary = public_4yr['MD_EARN_WNE_MALE0_P6'].mean()
print(f"\n10. Avg debt of women at public universities: ${women_public_debt:,.0f}")
print(f"11. Avg salary of women (public universities): ${women_public_salary:,.0f}")

# 12 & 13. Men at public/state universities
men_public_debt = public_4yr['MALE_DEBT_MDN'].mean()
men_public_salary = public_4yr['MD_EARN_WNE_MALE1_P6'].mean()
print(f"\n12. Avg debt of men at public universities: ${men_public_debt:,.0f}")
print(f"13. Avg salary of men (public universities): ${men_public_salary:,.0f}")

# 14. Percentage more White vs Latino from community college
high_white_cc = community_colleges[community_colleges['UGDS_WHITE'] >= 0.6]
high_hispanic_cc = community_colleges[community_colleges['UGDS_HISP'] >= 0.4]
white_cc_earnings = high_white_cc['MD_EARN_WNE_1YR'].mean()
latino_cc_earnings = high_hispanic_cc['MD_EARN_WNE_1YR'].mean()
pct_diff = ((white_cc_earnings - latino_cc_earnings) / latino_cc_earnings) * 100
print(f"\n14. White vs Latino CC earnings difference: {pct_diff:.1f}%")
print(f"    White CC avg: ${white_cc_earnings:,.0f} ({len(high_white_cc)} schools ≥60% White)")
print(f"    Latino CC avg: ${latino_cc_earnings:,.0f} ({len(high_hispanic_cc)} schools ≥40% Hispanic)")

# 15. PWI vs HBCU salary difference
pwi_salary = pwis['MD_EARN_WNE_1YR'].mean()
hbcu_salary = hbcus['MD_EARN_WNE_1YR'].mean()
salary_diff = pwi_salary - hbcu_salary
print(f"\n15. PWI vs HBCU annual salary difference: ${salary_diff:,.0f}")
print(f"    PWI avg: ${pwi_salary:,.0f} ({len(pwis)} institutions)")
print(f"    HBCU avg: ${hbcu_salary:,.0f} ({len(hbcus)} institutions)")

print("\n" + "=" * 60)
print("IMPORTANT CAVEATS")
print("=" * 60)
print("• Race+gender intersections unavailable; estimates use enrollment proxies")
print("• 'High-[race]' = institutions with high % of that demographic")
print("• MD_EARN_WNE_MALE0 = Female earnings, MD_EARN_WNE_MALE1 = Male earnings")
print("• Earnings measured 6 years after entry (P6) or 1 year after completion (1YR)")