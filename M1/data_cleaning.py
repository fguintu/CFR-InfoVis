import pandas as pd
import re

df = pd.read_csv('Most-Recent-Cohorts-Institution.csv', low_memory=False)

columns = [
    'INSTNM', 'ADDR', 'CITY', 'STABBR', 'ZIP', 'UGDS', 'UG', 'UGDS_MEN',
    'UGDS_WOMEN', 'UGDS_WHITE', 'UGDS_BLACK', 'UGDS_HISP', 'UGDS_ASIAN',
    'UGDS_AIAN', 'UGDS_NHPI', 'UGDS_2MOR', 'UGDS_NRA', 'UGDS_UNKN',
    'PPTUG_EF', 'PPTUG_EF2', 'UG25ABV', 'PCTFLOAN_DCS', 'FTFTPCTFLOAN',
    'PCTPELL_DCS', 'FTFTPCTPELL', 'DEBT_MDN', 'GRAD_DEBT_MDN',
    'WDRAW_DEBT_MDN', 'LO_INC_DEBT_MDN', 'MD_INC_DEBT_MDN',
    'HI_INC_DEBT_MDN', 'DEP_DEBT_MDN', 'IND_DEBT_MDN',
    'PELL_DEBT_MDN', 'NOPELL_DEBT_MDN', 'FEMALE_DEBT_MDN',
    'MALE_DEBT_MDN', 'FIRSTGEN_DEBT_MDN', 'NOTFIRSTGEN_DEBT_MDN',
    'GRAD_DEBT_MDN_SUPP', 'GRAD_DEBT_MDN10YR_SUPP', 'PLUS_DEBT_INST_MD', 
    'PLUS_DEBT_ALL_MD', 'PREDDEG', 'CONTROL', 'HBCU'
]


patterns = [
    r"^NUM[1-5]_(PUB|PRIV)",
    r"^PLUS_DEBT.*",
    r"^C100.*",
    r"^C150.*",
    r"^MD_EARN_WNE_.*"
]

regex = re.compile("|".join(patterns))

cols_to_keep = [
    col for col in df.columns
    if col in columns or regex.match(col)
]

df_filtered = df[cols_to_keep]

df_filtered.to_csv('filtered_data.csv', index=False)
