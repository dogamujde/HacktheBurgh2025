import json
import os
import glob

def verify_file(file_path):
    """Verify that all courses in the file have bullet points."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        total_courses = len(data)
        courses_with_bulletpoints = 0
        courses_with_bullet_points = 0  # Check both field names
        courses_missing_points = 0
        
        for course in data:
            if "bulletpoints" in course and course["bulletpoints"]:
                courses_with_bulletpoints += 1
            elif "bullet_points" in course and course["bullet_points"]:
                courses_with_bullet_points += 1
            else:
                courses_missing_points += 1
        
        print(f"\nVerification Results for {os.path.basename(file_path)}:")
        print(f"  Total courses: {total_courses}")
        print(f"  Courses with 'bulletpoints': {courses_with_bulletpoints}")
        print(f"  Courses with 'bullet_points': {courses_with_bullet_points}")
        print(f"  Courses missing bullet points: {courses_missing_points}")
        
        if courses_missing_points == 0:
            print(f"  ✅ All courses have bullet points")
        else:
            print(f"  ❌ {courses_missing_points} courses are missing bullet points")
        
        return {
            "file": os.path.basename(file_path),
            "total": total_courses,
            "with_bulletpoints": courses_with_bulletpoints,
            "with_bullet_points": courses_with_bullet_points,
            "missing": courses_missing_points,
            "success": courses_missing_points == 0
        }
    except Exception as e:
        print(f"Error verifying {file_path}: {e}")
        return {
            "file": os.path.basename(file_path),
            "error": str(e),
            "success": False
        }

def main():
    # Get all course JSON files
    files = glob.glob("scraped_data/courses/courses_*.json")
    
    print(f"Found {len(files)} course files to verify")
    
    results = []
    for file_path in files:
        result = verify_file(file_path)
        results.append(result)
    
    # Print summary
    print("\n=== Overall Summary ===")
    total_files = len(results)
    successful_files = sum(1 for r in results if r.get("success", False))
    print(f"Total files: {total_files}")
    print(f"Files with all courses having bullet points: {successful_files}")
    print(f"Files with issues: {total_files - successful_files}")
    
    # Print files with issues
    if total_files - successful_files > 0:
        print("\nFiles with issues:")
        for result in results:
            if not result.get("success", False):
                if "error" in result:
                    print(f"  - {result['file']}: Error - {result['error']}")
                else:
                    print(f"  - {result['file']}: {result['missing']} courses missing bullet points")

if __name__ == "__main__":
    main() 