import pandas as pd

df = pd.read_csv('data/filtered_data.csv', low_memory=False, na_values=['PS', '', 'NULL', 'PrivacySuppressed'])

#Debt differences across financial status categories

print("=" * 60)
print("DEBT DIFFERENCES ACROSS FINANCIAL STATUS CATEGORIES")
print("=" * 60)

categories = {
    "All students": "DEBT_MDN",
    "Graduates": "GRAD_DEBT_MDN",
    "Non-graduates": "WDRAW_DEBT_MDN",
    "Low income families": "LO_INC_DEBT_MDN",
    "Middle income families": "MD_INC_DEBT_MDN",
    "High income families": "HI_INC_DEBT_MDN",
    "Dependents": "DEP_DEBT_MDN",
    "Independents": "IND_DEBT_MDN",
    "PELL recipients": "PELL_DEBT_MDN",
    "Non-PELL recipients": "NOPELL_DEBT_MDN",
    "Female graduates": "FEMALE_DEBT_MDN",
    "Male graduates": "MALE_DEBT_MDN",
    "First-generation graduates": "FIRSTGEN_DEBT_MDN",
    "Non-first-generation graduates": "NOTFIRSTGEN_DEBT_MDN",
}

for label, column in categories.items():
    print(f"{label}: {df[column].mean():,.2f}")
    print("\n")

#Debt differences across demographics

print("=" * 60)
print("DEBT DIFFERENCES ACROSS DEMOGRAPHICS")
print("=" * 60)

demographic_groups = (
    df[['UGDS_WHITE', 'UGDS_BLACK', 'UGDS_HISP','UGDS_ASIAN','UGDS_AIAN',
        'UGDS_NHPI','UGDS_2MOR','UGDS_NRA','UGDS_UNKN']]
    .fillna(0)
    .sum(axis=1)
)

groups = ['UGDS_WHITE', 'UGDS_BLACK', 'UGDS_HISP', 'UGDS_ASIAN']

results = {}
male_results = {}
female_results = {}

for group in groups:
    group_vals = df[group].fillna(0)
    other_groups = demographic_groups - group_vals
    
    condition = group_vals >= other_groups
    
    mean_debt = df.loc[condition, 'DEBT_MDN'].mean()
    mean_male_debt = df.loc[condition, 'MALE_DEBT_MDN'].mean()
    mean_female_debt = df.loc[condition, 'FEMALE_DEBT_MDN'].mean()
    
    results[group] = mean_debt
    male_results[group] = mean_male_debt
    female_results[group] = mean_female_debt

for group in groups:
    clean_name = group.replace('UGDS_', '').title()
    
    print(f"{clean_name}: {results[group]:,.2f}")
    print(f"Male {clean_name}: {male_results[group]:,.2f}")
    print(f"Female {clean_name}: {female_results[group]:,.2f}")
    print("\n")

#Women earnings per Men earnings 

print("=" * 60)
print("WOMEN EARNINGS PER MEN EARNINGS")
print("=" * 60)

male_earnings = {
    "6 years": "MD_EARN_WNE_MALE1_P6",
    "7 years": "MD_EARN_WNE_MALE1_P7",
    "8 years": "MD_EARN_WNE_MALE1_P8",
    "9 years": "MD_EARN_WNE_MALE1_P9",
    "10 years": "MD_EARN_WNE_MALE1_P10",
    "11 years": "MD_EARN_WNE_MALE1_P11",
}

female_earnings = {
    "6 years": "MD_EARN_WNE_MALE0_P6",
    "7 years": "MD_EARN_WNE_MALE0_P7",
    "8 years": "MD_EARN_WNE_MALE0_P8",
    "9 years": "MD_EARN_WNE_MALE0_P9",
    "10 years": "MD_EARN_WNE_MALE0_P10",
    "11 years": "MD_EARN_WNE_MALE0_P11",
}

for year in male_earnings:
    male_col = male_earnings[year]
    female_col = female_earnings[year]
    
    male_mean = df[male_col].mean()
    female_mean = df[female_col].mean()
    
    ratio = female_mean / male_mean
    
    print(f"{year}: {ratio:.3f}")
    print("\n")


#Completion rates across demographics

print("=" * 60)
print("COMPLETION RATES ACROSS DEMOGRAPHICS")
print("=" * 60)

#C150_4_WHITE, C150_L4_WHITE
#C150_4_BLACK, C150_L4_BLACK
#C150_4_HISP, C150_L4_HISP
#C150_4_ASIAN, C150_L4_ASIAN
#C150_4_AIAN, C150_L4_AIAN
#C150_4_NHPI, C150_L4_NHPI
#C150_4_2MOR, C150_L4_2MOR
#C150_4_NRA, C150_L4_NRA
#C150_4_UNKN, C150_L4_UNKN

complete_4_year = {'White': 'C150_4_WHITE',
                   'Black': 'C150_4_BLACK',
                   'Hispanic': 'C150_4_HISP',
                   'Asian': 'C150_4_ASIAN',
                   'AIAN': 'C150_4_AIAN',
                   'Native Hawaiian': 'C150_4_NHPI',
                   'Two or more races': 'C150_4_2MOR',
                   'Non-resident Alien': 'C150_4_NRA',
                   'Unknown': 'C150_4_UNKN'}

complete_less_4_year = {'White': 'C150_L4_WHITE',
                        'Black': 'C150_L4_BLACK',
                        'Hispanic': 'C150_L4_HISP',
                        'Asian': 'C150_L4_ASIAN',
                        'AIAN': 'C150_L4_AIAN',
                        'Native Hawaiian': 'C150_L4_NHPI',
                        'Two or more races': 'C150_L4_2MOR',
                        'Non-resident Alien': 'C150_L4_NRA',
                        'Unknown': 'C150_L4_UNKN'
}

print("4 year completion rates")
for race, column in complete_4_year.items():
    print(f"{race}: {df[column].mean():.2f}\n")

print("Less than 4 year completion rates")
for race, column in complete_less_4_year.items():
    print(f"{race}: {df[column].mean():.2f}\n")