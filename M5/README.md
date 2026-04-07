/*
THIS ASSIGNMENT IS OUR OWN WORK, IT WAS WRITTEN WITHOUT CONSULTING WORK WRITTEN BY OTHER STUDENTS
OR COPIED FROM ONLINE RESOURCES. NO AI TOOLS WERE USED.
Robert Jarman, Caleb Jennings, Frederic Guintu
*/

## How to run (M5)

- Open `M5/index.html`
- Use VSCode “Live Server” → **Go Live**

This milestone is implemented as a static site (no React build step).

## Data file required

`M5/main.js` loads `../data/filtered_data.csv`. If the page shows an error loading data, the CSV is missing.

To generate it locally:

- Download the College Scorecard "Most Recent Cohorts Institution" CSV
- Place it at `data/Most-Recent-Cohorts-Institution.csv`
- Run `python3 M1/data_cleaning.py`

That script writes `data/filtered_data.csv`, which the M5 page reads.

## Tech stack (current repo)

- HTML + CSS
- JavaScript (ES modules via `<script type="module">`)
- D3.js (loaded from CDN)
- PapaParse (CSV parsing, loaded from CDN)