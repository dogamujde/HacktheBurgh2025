#!/usr/bin/env python3
"""
Script to copy bullet points from test_courses.json to a specific school JSON file.

This script:
1. Reads bullet points from test_courses.json
2. Adds bullet points to each course in the target file
3. Saves the updated file with a backup

Usage:
  python3 copy_bulletpoints_to_specific_file.py
"""

import os
import json
import random
import shutil

# Path to the test courses file with bullet points
TEST_FILE = "test_courses.json"

# Path to the target course file
TARGET_FILE = "scraped_data/courses/courses_Deanery_of_Clinical_Sciences.json"

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

def process_target_file(bullet_points):
    """Process the target file to add bullet points."""
    if not bullet_points:
        print("No bullet points available to copy. Exiting.")
        return False
        
    try:
        # Check if file exists
        if not os.path.exists(TARGET_FILE):
            print(f"Error: Target file not found at {TARGET_FILE}")
            return False
            
        # Read the file
        with open(TARGET_FILE, 'r', encoding='utf-8') as f:
            courses = json.load(f)
        
        if not isinstance(courses, list):
            print(f"Error: {TARGET_FILE} does not contain a list of courses")
            return False
            
        # Count of courses in the file
        total_courses = len(courses)
        print(f"Found {total_courses} courses in {TARGET_FILE}")
        
        # Create backup
        backup_path = f"{TARGET_FILE}.bak"
        shutil.copy2(TARGET_FILE, backup_path)
        print(f"Created backup at {backup_path}")
        
        # For each course, add bullet points
        for course in courses:
            # Randomly select bullet points from test file
            selected_bullet_points = random.choice(bullet_points)
            
            # Add the bullet points field
            course["bulletpoints"] = selected_bullet_points
        
        # Save the updated file
        with open(TARGET_FILE, 'w', encoding='utf-8') as f:
            json.dump(courses, f, indent=2, ensure_ascii=False)
            
        print(f"Updated all {total_courses} courses in {TARGET_FILE}")
        
        return True
        
    except Exception as e:
        print(f"Error processing {TARGET_FILE}: {e}")
        return False

def main():
    """Main function to copy bullet points to the target file."""
    # Load bullet points from test file
    bullet_points = load_test_bullet_points()
    
    # Process the target file
    success = process_target_file(bullet_points)
    
    if success:
        print("Successfully updated the target file with bullet points!")
    else:
        print("Failed to update the target file.")

if __name__ == "__main__":
    main() 