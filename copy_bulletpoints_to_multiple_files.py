#!/usr/bin/env python3
"""
Script to copy bullet points from test_courses.json to multiple school JSON files.

This script:
1. Reads bullet points from test_courses.json
2. Adds bullet points to each course in the specified target files
3. Saves the updated files with backups

Usage:
  python3 copy_bulletpoints_to_multiple_files.py
"""

import os
import json
import random
import shutil

# Path to the test courses file with bullet points
TEST_FILE = "test_courses.json"

# Paths to the target course files - add or remove files as needed
TARGET_FILES = [
    "scraped_data/courses/courses_School_of_Chemistry.json",
    "scraped_data/courses/courses_School_of_Informatics.json",
    "scraped_data/courses/courses_Edinburgh_Medical_School.json",
    "scraped_data/courses/courses_School_of_Engineering.json"
]

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
        for i, bp in enumerate(bullet_points, 1):
            print(f"Bullet point set {i}: {bp}")
        return bullet_points
        
    except Exception as e:
        print(f"Error loading test file: {e}")
        return []

def process_target_file(file_path, bullet_points):
    """Process a single target file to add bullet points."""
    if not bullet_points:
        print(f"Skipping {file_path} - no bullet points available")
        return False
        
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            print(f"Error: Target file not found at {file_path}")
            return False
            
        # Read the file
        with open(file_path, 'r', encoding='utf-8') as f:
            courses = json.load(f)
        
        if not isinstance(courses, list):
            print(f"Error: {file_path} does not contain a list of courses")
            return False
            
        # Count of courses in the file
        total_courses = len(courses)
        print(f"Found {total_courses} courses in {file_path}")
        
        # Create backup
        backup_path = f"{file_path}.bak"
        shutil.copy2(file_path, backup_path)
        print(f"Created backup at {backup_path}")
        
        # For each course, add bullet points
        for course in courses:
            # Randomly select bullet points from test file
            selected_bullet_points = random.choice(bullet_points)
            
            # Add the bullet points field
            course["bulletpoints"] = selected_bullet_points
        
        # Save the updated file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(courses, f, indent=2, ensure_ascii=False)
            
        print(f"Updated all {total_courses} courses in {file_path}")
        
        return True
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Main function to copy bullet points to multiple target files."""
    # Load bullet points from test file
    bullet_points = load_test_bullet_points()
    
    if not bullet_points:
        print("No bullet points available to copy. Exiting.")
        return
    
    # Process each target file
    success_count = 0
    for i, file_path in enumerate(TARGET_FILES, 1):
        print(f"\nProcessing file {i}/{len(TARGET_FILES)}: {file_path}")
        success = process_target_file(file_path, bullet_points)
        if success:
            success_count += 1
    
    # Print summary
    print(f"\nSummary: Successfully processed {success_count} out of {len(TARGET_FILES)} files")

if __name__ == "__main__":
    main() 