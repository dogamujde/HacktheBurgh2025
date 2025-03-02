import json
import pandas as pd
import numpy as np
import csv
import os
import re
from pathlib import Path
from collections import defaultdict

def extract_quota(academic_year):
    if not academic_year or not isinstance(academic_year, str):
        return None
    # Extract number after "Quota:" using regex
    match = re.search(r'Quota:\s*(\d+)', academic_year)
    if match:
        return int(match.group(1))
    return None

def calculate_popularity(cohort_size, quota):
    # Return None if either value is None or if quota is 0
    if cohort_size is None or quota is None or quota == 0:
        return None
    # Calculate percentage and round to 2 decimal places
    return round((cohort_size / quota) * 100, 2)

def calculate_weighted_popularity(cohort_size, quota):
    # Return None if either value is None or if quota is 0
    if cohort_size is None or quota is None or quota == 0:
        return None
    # Calculate weighted popularity score: cohortSize × (cohortSize/quota)
    # This balances absolute size with how full the course is
    return round(cohort_size * (cohort_size / quota), 2)

def merge_data():
    # Read the CSV files with explicit encoding
    encodings = ['utf-8', 'latin1', 'cp1252']
    
    # Read cohort data
    csv_data = None
    for encoding in encodings:
        try:
            csv_data = pd.read_csv('courseCohortData.csv', usecols=['courseCode', 'cohortSize'], encoding=encoding)
            break
        except UnicodeDecodeError:
            continue
        except Exception as e:
            print(f"Error reading cohort CSV with {encoding} encoding:", str(e))
            continue
    else:
        print("Failed to read cohort CSV file with any encoding")
        return
    
    # Read location data
    location_data = None
    for encoding in encodings:
        try:
            location_data = pd.read_csv('courseLocationData copy.csv', usecols=['courseCode', 'Campus'], encoding=encoding)
            break
        except UnicodeDecodeError:
            continue
        except Exception as e:
            print(f"Error reading location CSV with {encoding} encoding:", str(e))
            continue
    
    # Process location data to get unique campuses per course
    campus_dict = defaultdict(set)
    if location_data is not None:
        for _, row in location_data.iterrows():
            campus = row['Campus'].strip()
            if campus.startswith('*'):
                campus = campus[1:]  # Remove the leading asterisk
            campus_dict[row['courseCode']].add(campus)
    
    # Create a dictionary to store merged data
    merged_data = {}
    
    # Read all JSON files in the courses directory
    scraped_dir = Path('scraped_data/courses')
    if scraped_dir.exists():
        for json_file in scraped_dir.glob('*.json'):
            print(f"Processing {json_file}")
            with open(json_file, 'r') as f:
                try:
                    data = json.load(f)
                    # Check if data is a list or dictionary and has the required fields
                    if isinstance(data, (list, dict)):
                        items = data if isinstance(data, list) else [data]
                        for item in items:
                            if 'code' in item:
                                course_code = item['code']
                                quota = extract_quota(item.get('academic_year'))  # Extract quota from academic_year
                                # Match with CSV data
                                matching_rows = csv_data[csv_data['courseCode'] == course_code]
                                if not matching_rows.empty:
                                    cohort_size = matching_rows.iloc[0]['cohortSize']
                                    # Handle NaN values
                                    if pd.isna(cohort_size):
                                        cohort_size = None
                                    else:
                                        cohort_size = int(cohort_size)
                                    
                                    # Calculate popularity metrics
                                    percent_full = calculate_popularity(cohort_size, quota)
                                    weighted_score = calculate_weighted_popularity(cohort_size, quota)
                                    
                                    # Get campus information
                                    campuses = list(campus_dict.get(course_code, []))
                                        
                                    merged_data[course_code] = {
                                        'code': course_code,
                                        'quota': quota,
                                        'cohortSize': cohort_size,
                                        'percentFull': percent_full,
                                        'popularityScore': weighted_score,
                                        'campuses': campuses
                                    }
                except json.JSONDecodeError:
                    print(f"Error reading {json_file}")
                    continue
    
    # Write merged data to new JSON file
    with open('merged_course_data.json', 'w') as f:
        json.dump(merged_data, f, indent=2)
        print(f"Successfully created merged_course_data.json with {len(merged_data)} entries")

if __name__ == "__main__":
    merge_data()
