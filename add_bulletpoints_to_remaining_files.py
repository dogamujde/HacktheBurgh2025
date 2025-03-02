import json
import os
import random
import glob

# Constants
SOURCE_FILE = "test_courses.json"
# List of files that still need bullet points
TARGET_FILES = [
    "scraped_data/courses/courses_Deanery_of_Biomedical_Sciences.json",
    "scraped_data/courses/courses_School_of_Divinity.json",
    "scraped_data/courses/courses_Royal_Dick_School_of_Veterinary_Studies.json",
    "scraped_data/courses/courses_School_of_Law.json",
    "scraped_data/courses/courses_School_of_Physics_and_Astronomy.json",
    "scraped_data/courses/courses_School_of_Economics.json",
    "scraped_data/courses/courses_Moray_House_School_of_Education_and_Sport.json",
    "scraped_data/courses/courses_School_of_Biological_Sciences.json",
    "scraped_data/courses/courses_Edinburgh_Futures_Institute.json",
    "scraped_data/courses/courses_School_of_Health_in_Social_Science.json"
]

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

def process_file(file_path, bullet_points):
    """Process a single file and add bullet points to each course."""
    try:
        # Load the file
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        course_count = len(data)
        print(f"Found {course_count} courses in {file_path}")
        
        # Create a backup
        backup_path = f"{file_path}.bak"
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print(f"Created backup at {backup_path}")
        
        # Update each course with a random set of bullet points
        for course in data:
            bp_set = random.choice(bullet_points)
            course["bulletpoints"] = bp_set
        
        # Save the updated file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        
        print(f"Updated all {course_count} courses in {file_path}")
        return True
    except json.JSONDecodeError as e:
        print(f"JSON error processing {file_path}: {e}")
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    # Load bullet points from source file
    bullet_points = load_bullet_points(SOURCE_FILE)
    if not bullet_points:
        print("No bullet points found in source file. Exiting.")
        return
    
    # Process each target file
    success_count = 0
    for i, file_path in enumerate(TARGET_FILES, 1):
        print(f"\nProcessing file {i}/{len(TARGET_FILES)}: {file_path}")
        if process_file(file_path, bullet_points):
            success_count += 1
    
    # Print summary
    print(f"\nSuccessfully processed {success_count} out of {len(TARGET_FILES)} files")

if __name__ == "__main__":
    main() 