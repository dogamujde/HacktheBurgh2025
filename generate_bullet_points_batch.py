#!/usr/bin/env python3
"""
Generate bullet points for all course files in the scraped_data directory.

This script:
1. Finds all course JSON files in the scraped_data directory
2. Filters out courses with "period" set to "Not delivered this year"
3. Processes each remaining course in those files
4. Generates 3 bullet points using OpenAI API for each course
5. Adds those bullet points to the course data under the "bulletpoints" field
6. Saves the updated JSON files with filtered courses only

Usage: 
  python3 generate_bullet_points_batch.py

Requirements:
  pip install openai
"""

import os
import json
import sys
from openai import OpenAI
import time

def generate_bullet_points(text):
    """
    Generate 3 bullet points about a course using OpenAI API.
    
    Args:
        text (str): The course description or summary
        
    Returns:
        str: Three bullet points as a single string
    """
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=[
                {"role": "system", "content": "You are a helpful academic assistant that creates concise bullet points about university courses."},
                {"role": "user", "content": f"Generate EXACTLY 3 bullet points that summarize the key aspects of this course. Return ONLY the 3 bullet points without any additional text or numbering. Each bullet point should be prefixed with '• ' and be on a new line.\n\nCourse information: {text}"}
            ],
            temperature=0.7,
            max_tokens=300,
        )
        
        # Extract the bullet points from the response
        bullet_points = response.choices[0].message.content.strip()
        
        # Ensure we have exactly 3 bullet points
        points = bullet_points.split('\n')
        filtered_points = [p.strip() for p in points if p.strip()]
        
        # Add bullet prefix if not present
        formatted_points = []
        for point in filtered_points:
            if not point.startswith('•'):
                point = f"• {point}"
            formatted_points.append(point)
        
        # Pad or truncate to exactly 3 bullet points
        while len(formatted_points) < 3:
            formatted_points.append("• Additional information not available")
        
        formatted_points = formatted_points[:3]  # Limit to 3 points
        
        return '\n'.join(formatted_points)
        
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return "• Error generating course information\n• Please try again later\n• Contact support if the problem persists"

def process_json_file(file_path):
    """
    Process a JSON file containing course information:
    1. Filter out courses with period "Not delivered this year"
    2. Add bullet points to remaining courses
    
    Args:
        file_path (str): Path to the JSON file
        
    Returns:
        tuple: (success, courses_updated, courses_skipped, courses_removed)
    """
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            print(f"Error: File not found - {file_path}")
            return False, 0, 0, 0
            
        print(f"Reading file: {file_path}")
        # Read the JSON file
        with open(file_path, 'r', encoding='utf-8') as file:
            try:
                courses = json.load(file)
            except json.JSONDecodeError as e:
                print(f"Error: Invalid JSON format in {file_path} - {e}")
                return False, 0, 0, 0
        
        # Ensure courses is a list
        if not isinstance(courses, list):
            print(f"Error: Expected a list of courses in {file_path}, but got {type(courses)}")
            return False, 0, 0, 0
        
        total_courses_original = len(courses)
        
        # Filter out courses with period "Not delivered this year"
        filtered_courses = []
        removed_courses = 0
        
        for course in courses:
            period = course.get("period", "")
            if period == "Not delivered this year":
                removed_courses += 1
                course_name = course.get('name', course.get('title', 'Unknown'))
                # Print only for significant numbers of removed courses
                if removed_courses <= 5 or removed_courses % 10 == 0:
                    print(f"Skipping non-delivered course: {course_name}")
            else:
                filtered_courses.append(course)
        
        # Report on filtered courses
        total_courses = len(filtered_courses)
        print(f"\nFiltered out {removed_courses} courses that are not delivered this year from {file_path}")
        print(f"Processing {total_courses} remaining courses...")
        
        updated_courses = 0
        skipped_courses = 0
        
        # Process each remaining course
        for i, course in enumerate(filtered_courses, 1):
            # Status update for every 10th course or first/last
            if i % 10 == 0 or i == 1 or i == total_courses:
                course_name = course.get('name', course.get('title', 'Unknown'))
                print(f"Processing course {i}/{total_courses}: {course_name}")
            
            # Check if course already has bullet points (check both field names)
            if ("bulletpoints" in course and course["bulletpoints"]) or ("bullet_points" in course and course["bullet_points"]):
                skipped_courses += 1
                continue
                
            # Get text to analyze
            course_description = course.get("course_description", "")
            summary = course.get("summary", "")
            
            # Skip course description if it's "Not entered" or empty
            if not course_description or course_description.strip() == "" or course_description == "Not entered":
                text_to_analyze = summary
            else:
                text_to_analyze = course_description
            
            # If no text available, set default message
            if not text_to_analyze or text_to_analyze.strip() == "":
                course["bulletpoints"] = "• No information available\n• Please check the course catalog\n• Contact the course administrator"
                updated_courses += 1
                continue
                
            # Generate bullet points
            bullet_points = generate_bullet_points(text_to_analyze)
            
            # Add bullet points to course with the correct field name that the frontend expects
            course["bulletpoints"] = bullet_points
            updated_courses += 1
            
            # Add a small delay to avoid rate limiting
            if i % 5 == 0:
                time.sleep(0.5)
        
        # Always save to update the file with filtered courses
        print(f"Saving changes to file: {file_path}")
        # Create a backup of the original file
        backup_path = f"{file_path}.bak"
        try:
            with open(backup_path, 'w', encoding='utf-8') as backup_file:
                with open(file_path, 'r', encoding='utf-8') as original_file:
                    backup_file.write(original_file.read())
            print(f"Created backup file: {backup_path}")
        except Exception as e:
            print(f"Warning: Could not create backup file: {e}")
            
        # Write updated data back to the file (filtered courses only)
        try:
            with open(file_path, 'w', encoding='utf-8') as file:
                json.dump(filtered_courses, file, indent=2, ensure_ascii=False)
                file.flush()
                os.fsync(file.fileno())  # Force write to disk
            print(f"File saved successfully!")
        except Exception as e:
            print(f"ERROR SAVING FILE: {e}")
            return False, updated_courses, skipped_courses, removed_courses
            
        # Verify the save worked
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                verify_courses = json.load(file)
                
            # Verify the count first
            if len(verify_courses) != total_courses:
                print(f"WARNING: Verification found {len(verify_courses)} courses, expected {total_courses}")
            else:
                print(f"Verification successful: Saved {total_courses} courses (removed {removed_courses})")
                
            # Then check if bullet points are present
            verified = False
            for course in verify_courses:
                if "bulletpoints" in course and course["bulletpoints"]:
                    verified = True
                    break
            
            if verified:
                print("Verification successful: Bullet points were saved correctly")
            else:
                print("WARNING: Verification failed - Could not find bullet points in the saved file")
        except Exception as e:
            print(f"Error during verification: {e}")
            
        print(f"Summary for {file_path}:")
        print(f"- Original course count: {total_courses_original}")
        print(f"- Courses removed (not delivered): {removed_courses}")
        print(f"- Remaining courses: {total_courses}")
        print(f"- Courses updated with bullet points: {updated_courses}")
        print(f"- Courses skipped (already had bullet points): {skipped_courses}")
        
        return True, updated_courses, skipped_courses, removed_courses
        
    except Exception as e:
        print(f"Unexpected error processing file: {e}")
        return False, 0, 0, 0

def find_courses_directory():
    """
    Find the courses directory from common locations.
    
    Returns:
        str: Path to the courses directory, or None if not found
    """
    # Print current working directory for debugging
    cwd = os.getcwd()
    print(f"Current working directory: {cwd}")
    
    # Try several possible locations
    possible_paths = [
        os.path.join(cwd, "scraped_data", "courses"),
        os.path.join(cwd, "..", "scraped_data", "courses"),
        os.path.join(os.path.dirname(cwd), "scraped_data", "courses"),
        "/Users/dogamujde/Desktop/hacktheburghEdTech/scraped_data/courses"
    ]
    
    for path in possible_paths:
        if os.path.exists(path) and os.path.isdir(path):
            print(f"Found courses directory: {path}")
            return path
    
    print("Could not find courses directory!")
    return None

def main():
    # Check if OpenAI API key is set
    if not os.environ.get("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable is not set.")
        print("Please set it by running: export OPENAI_API_KEY=your_api_key")
        sys.exit(1)
    
    # Find the courses directory
    courses_dir = find_courses_directory()
    if not courses_dir:
        sys.exit(1)
    
    # Get all JSON files in the directory
    json_files = [f for f in os.listdir(courses_dir) if f.endswith('.json')]
    print(f"Found {len(json_files)} JSON files to process")
    
    # Sample files to demonstrate
    if len(json_files) > 0:
        print("Sample files found:")
        for i, file in enumerate(json_files[:3]):
            print(f"  {i+1}. {file}")
        if len(json_files) > 3:
            print(f"  ... and {len(json_files) - 3} more")
    
    # Ask for confirmation before proceeding
    response = input("\nDo you want to process all these files? This will filter out non-delivered courses and add bullet points. (y/n): ")
    if response.lower() != 'y':
        print("Operation cancelled by user.")
        sys.exit(0)
    
    # Process all files
    print("\n===============")
    print("PROCESSING FILES")
    print("===============")
    
    total_files = len(json_files)
    successful_files = 0
    total_courses_updated = 0
    total_courses_skipped = 0
    total_courses_removed = 0
    
    for i, file in enumerate(json_files, 1):
        file_path = os.path.join(courses_dir, file)
        print(f"\nProcessing file {i}/{total_files}: {file}")
        
        success, courses_updated, courses_skipped, courses_removed = process_json_file(file_path)
        
        if success:
            successful_files += 1
            total_courses_updated += courses_updated
            total_courses_skipped += courses_skipped
            total_courses_removed += courses_removed
        
        print(f"File {i}/{total_files} completed: {courses_updated} courses updated, {courses_skipped} courses skipped, {courses_removed} courses removed")
        
        # Add a delay between files to avoid overwhelming the API
        if i < total_files:
            print("Waiting 2 seconds before next file...")
            time.sleep(2)
    
    # Print summary
    print("\n===============")
    print("BATCH PROCESSING COMPLETE")
    print("===============")
    print(f"Processed {total_files} files")
    print(f"Successful: {successful_files}")
    print(f"Failed: {total_files - successful_files}")
    print(f"Total courses updated: {total_courses_updated}")
    print(f"Total courses skipped: {total_courses_skipped}")
    print(f"Total courses removed: {total_courses_removed}")
    print("===============")

if __name__ == "__main__":
    main() 