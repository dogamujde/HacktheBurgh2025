#!/usr/bin/env python3
"""
Script to copy bullet points from test_courses.json to all school JSON files.

This script:
1. Reads bullet points from test_courses.json
2. For each school JSON file in the scraped_data/courses directory:
   a. Reads the file
   b. For each course, adds the bullet points
   c. Saves the updated file with a backup

Usage:
  python3 copy_test_bulletpoints.py
"""

import os
import json
import random
import shutil

# Path to the test courses file with bullet points
TEST_FILE = "test_courses.json"

# Path to the courses directory
COURSES_DIR = "scraped_data/courses"

def load_test_bullet_points():
    """Load bullet points from the test file."""
    try:
        with open(TEST_FILE, 'r', encoding='utf-8') as f:
            test_courses = json.load(f)
            
        # Extract bullet points from test courses
        bullet_points = [course.get("bulletpoints", "") for course in test_courses if "bulletpoints" in course]
        
        if not bullet_points:
            print(f"No bullet points found in {TEST_FILE}")
            return []
            
        print(f"Loaded {len(bullet_points)} bullet point sets from {TEST_FILE}")
        return bullet_points
        
    except Exception as e:
        print(f"Error loading test file: {e}")
        return []

def process_school_file(file_path, bullet_points):
    """Process a single school JSON file to add bullet points."""
    if not bullet_points:
        print(f"Skipping {file_path} - no bullet points available")
        return False
        
    try:
        # Read the file
        with open(file_path, 'r', encoding='utf-8') as f:
            courses = json.load(f)
        
        if not isinstance(courses, list):
            print(f"Error: {file_path} does not contain a list of courses")
            return False
            
        # Count of courses updated
        updated_count = 0
        
        # For each course, add bullet points
        for course in courses:
            # Randomly select bullet points from test file
            selected_bullet_points = random.choice(bullet_points)
            
            # Add the bullet points field
            course["bulletpoints"] = selected_bullet_points
            updated_count += 1
        
        # Create backup
        backup_path = f"{file_path}.bak"
        shutil.copy2(file_path, backup_path)
        
        # Save the updated file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(courses, f, indent=2, ensure_ascii=False)
            
        print(f"Updated {updated_count} courses in {file_path}")
        print(f"Created backup at {backup_path}")
        
        return True
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Main function to copy bullet points to all school files."""
    # Load bullet points from test file
    bullet_points = load_test_bullet_points()
    
    if not bullet_points:
        print("No bullet points available to copy. Exiting.")
        return
    
    # Get all JSON files in the courses directory
    try:
        if not os.path.exists(COURSES_DIR):
            print(f"Error: Courses directory not found at {COURSES_DIR}")
            return
            
        files = [f for f in os.listdir(COURSES_DIR) if f.endswith('.json') and not f.endswith('.bak')]
        
        if not files:
            print(f"No JSON files found in {COURSES_DIR}")
            return
            
        print(f"Found {len(files)} JSON files to process")
        
        # Process each file
        processed_count = 0
        for i, file_name in enumerate(files, 1):
            file_path = os.path.join(COURSES_DIR, file_name)
            print(f"\nProcessing file {i}/{len(files)}: {file_name}")
            
            success = process_school_file(file_path, bullet_points)
            if success:
                processed_count += 1
        
        print(f"\nSummary: Successfully processed {processed_count} out of {len(files)} files")
        
    except Exception as e:
        print(f"Error in main process: {e}")

if __name__ == "__main__":
    main() 