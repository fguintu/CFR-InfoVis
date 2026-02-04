# [Project Name]
CS 441 Information Visualization 

Abstract

[Project Name]  We chose a dataset called College Scorecard provided by collegescorecard.ed.gov (http://collegescorecard.ed.gov/). Specifically, we are using their “Most Recent Institution-Level Data.” This provides institution-level data files for 2023-24 “containing aggregate data for each institution”. It includes “information on institutional characteristics, enrollment, student aid, costs, and student outcomes.” 

Initially it contained 6429 rows and 3306 columns, for a total of 21 million data points! This is quite a lot. However, we want to focus on information specifically about institution name/location, student demographics, financial aid, debt, completion rates, and earnings. So using the documentation they provided we were able to sort through the 3306 columns and narrow the scope down to only 194 relevant columns. That brings our total data points to a manageable 1 million.

While 194 may sound like a lot of columns, the data can really be divided into 6 main categories (name/location, student demographics, financial aid, debt, completion rates, and earnings). Each category has several related columns. For example, the category of completion rates has several related columns that have data about completion rates per race and per financial aid as well as pooled rates from the previous 2 years. Thanks to the documentation, we can easily make sense of all 194 fields and use them for data analysis.
