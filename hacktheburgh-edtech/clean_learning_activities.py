import os
import json
import re

def clean_learning_activities():
    """
    Iterates over JSON files in the /courses directory and cleans 
    learning_activities fields by removing newline characters and extra spaces.
    """
    # Get the directory path - updated to use the correct path from config
    current_dir = os.getcwd()
    courses_dir = os.path.join(os.path.dirname(current_dir), 'scraped_data', 'courses')
    
    # Check if directory exists
    if not os.path.exists(courses_dir):
        print(f"Error: {courses_dir} directory not found.")
        return
    
    # Count files processed
    total_files = 0
    updated_files = 0
    updated_courses = 0
    
    # Process each JSON file in the directory
    for filename in os.listdir(courses_dir):
        if not filename.endswith('.json'):
            continue
            
        total_files += 1
        file_path = os.path.join(courses_dir, filename)
        file_modified = False
        
        print(f"Processing {filename}...")
        
        try:
            # Read the JSON file
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
            
            # Check if data is a list of courses or a single course
            courses = data if isinstance(data, list) else [data]
            
            # Process each course in the file
            for course in courses:
                if "learning_activities" in course:
                    original = course["learning_activities"]
                    
                    # Clean the learning_activities field
                    if isinstance(original, str):
                        # Remove newlines and normalize spaces
                        cleaned = re.sub(r'\s+', ' ', original).strip()
                        
                        # Update only if changed
                        if cleaned != original:
                            course["learning_activities"] = cleaned
                            file_modified = True
                            updated_courses += 1
                            print(f"  Cleaned learning_activities for course {course.get('code', 'unknown')}:")
                            print(f"    Before: {original}")
                            print(f"    After:  {cleaned}")
            
            # Write back to the file if modified
            if file_modified:
                with open(file_path, 'w', encoding='utf-8') as file:
                    json.dump(data, file, indent=2, ensure_ascii=False)
                updated_files += 1
                
        except Exception as e:
            print(f"Error processing {filename}: {str(e)}")
    
    # Print summary
    print("\nSummary:")
    print(f"Total JSON files processed: {total_files}")
    print(f"Files updated: {updated_files}")
    print(f"Courses with cleaned learning_activities: {updated_courses}")

if __name__ == "__main__":
    clean_learning_activities() 