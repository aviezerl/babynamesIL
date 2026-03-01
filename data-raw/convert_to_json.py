import pandas as pd
import json
import gzip

def convert_data_for_static_site():
    # Load data
    babynames = pd.read_csv("babynamesIL.csv")
    babynames_totals = pd.read_csv("babynamesIL_totals.csv")
    
    # Create names by sector lookup
    names_by_sector = (
        babynames[["sector", "name"]]
        .drop_duplicates()
        .groupby(["sector"])["name"]
        .apply(list)
        .to_dict()
    )
    
    # Convert to dictionary for efficient lookup
    babynames_dict = {}
    for _, row in babynames.iterrows():
        key = f"{row['sector']}|{row['name']}"
        if key not in babynames_dict:
            babynames_dict[key] = []
        babynames_dict[key].append({
            'year': int(row['year']),
            'sex': row['sex'],
            'n': int(row['n']),
            'prop': float(row['prop'])
        })
    
    # Convert totals
    totals_dict = {}
    for _, row in babynames_totals.iterrows():
        key = f"{row['sector']}|{row['name']}"
        if key not in totals_dict:
            totals_dict[key] = {'M': 0, 'F': 0}
        totals_dict[key][row['sex']] = int(row['total'])
    
    # Create the final data structure
    data = {
        'names_by_sector': names_by_sector,
        'babynames': babynames_dict,
        'totals': totals_dict
    }
    
    # Save as compressed JSON
    with gzip.open('../docs/data.json.gz', 'wt', encoding='utf-8') as f:
        json.dump(data, f, separators=(',', ':'))
    
    # Also save uncompressed version
    with open('../docs/data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, separators=(',', ':'))
    
    print(f"Data converted successfully!")
    print(f"Original CSV size: ~{(babynames.memory_usage(deep=True).sum() / 1024 / 1024):.1f} MB")
    
    import os
    json_size = os.path.getsize('../docs/data.json') / 1024 / 1024
    gzip_size = os.path.getsize('../docs/data.json.gz') / 1024 / 1024
    print(f"JSON size: {json_size:.1f} MB")
    print(f"Gzipped JSON size: {gzip_size:.1f} MB")

if __name__ == "__main__":
    convert_data_for_static_site() 