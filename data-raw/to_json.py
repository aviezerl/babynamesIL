import pandas as pd
import json

# Convert babynamesIL.csv
df = pd.read_csv('data-raw/babynamesIL.csv')
df.to_json('docs/data/babynamesIL.json', orient='records')

# Convert babynamesIL_totals.csv
df_totals = pd.read_csv('data-raw/babynamesIL_totals.csv')
df_totals.to_json('docs/data/babynamesIL_totals.json', orient='records')