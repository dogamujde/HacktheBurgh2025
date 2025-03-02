import json
import os
import random
import re
from pathlib import Path

# Constants
SOURCE_FILE = "test_courses.json"
TARGET_FILE = "scraped_data/courses/courses_School_of_Chemistry.json"

def load_bullet_points(source_file):
    """Load bullet points from the source file."""
    try:
        with open(source_file, 'r', encoding='utf-8') as f:
            source_data = json.load(f)
        
        bullet_points = []
        for course in source_data:
            if "bulletpoints" in course and course["bulletpoints"]:
                bullet_points.append(course["bulletpoints"])
        
        print(f"Loaded {len(bullet_points)} bullet point sets from {source_file}")
        for i, bp in enumerate(bullet_points, 1):
            print(f"Bullet point set {i}: {bp}")
        
        return bullet_points
    except Exception as e:
        print(f"Error loading bullet points from {source_file}: {e}")
        return []

def fix_chemistry_json(file_path):
    """Fix the JSON syntax error in the chemistry file."""
    try:
        # Read the content of the file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Fix the specific issue - add empty string and closing brackets
        if content.strip().endswith('"prohibited_combinations":'):
            fixed_content = content.strip() + ' ""' + '\n  }\n]'
            
            # Create a backup
            backup_path = f"{file_path}.broken"
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Created backup of broken file at {backup_path}")
            
            # Write the fixed content
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            print(f"Fixed JSON syntax in {file_path}")
            
            # Verify the fixed content
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    json.load(f)
                print("Successfully fixed the JSON file")
                return True
            except json.JSONDecodeError as e:
                print(f"File is still not valid JSON after fixing: {e}")
                return False
        else:
            print(f"File doesn't end with 'prohibited_combinations:' as expected")
            return False
    except Exception as e:
        print(f"Error fixing chemistry JSON file: {e}")
        return False

def update_chemistry_file(target_file, bullet_points):
    """Update the Chemistry file with bullet points."""
    # First fix the JSON file
    if not fix_chemistry_json(target_file):
        print(f"Could not fix {target_file}, skipping")
        return
    
    try:
        # Now load the fixed file
        with open(target_file, 'r', encoding='utf-8') as f:
            target_data = json.load(f)
        
        course_count = len(target_data)
        print(f"Found {course_count} courses in {target_file}")
        
        # Create a backup of the fixed file
        backup_path = f"{target_file}.bak"
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(target_data, f, indent=2)
        print(f"Created backup at {backup_path}")
        
        # Update each course with a random set of bullet points
        for course in target_data:
            bp_set = random.choice(bullet_points)
            course["bulletpoints"] = bp_set
        
        # Save the updated file
        with open(target_file, 'w', encoding='utf-8') as f:
            json.dump(target_data, f, indent=2)
        
        print(f"Updated all {course_count} courses in {target_file}")
    except Exception as e:
        print(f"Error updating courses in {target_file}: {e}")

def main():
    # Load bullet points from source file
    bullet_points = load_bullet_points(SOURCE_FILE)
    if not bullet_points:
        print("No bullet points found in source file. Exiting.")
        return
    
    # Update the chemistry file
    update_chemistry_file(TARGET_FILE, bullet_points)

if __name__ == "__main__":
    main() 