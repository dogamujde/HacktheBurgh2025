#!/usr/bin/env python3

"""
Script to generate bullet points for all courses and add them to the course JSON files.

This script:
1. Finds all course JSON files in the scraped_data directory
2. Processes each course in those files
3. Generates 3 bullet points using OpenAI API for each course
4. Adds those bullet points to the course data as a single string with newlines
5. Saves the updated JSON files

Usage: 
  python3 generate_course_bullets.py

Requirements:
  pip install openai tqdm
"""

import os
import json
import time
import sys
from pathlib import Path
import openai
from tqdm import tqdm

# Print current working directory for debugging
print(f"Current working directory: {os.getcwd()}")

# Set your OpenAI API key directly
OPENAI_API_KEY = "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"
print("Using provided OpenAI API key")

# Configure OpenAI
openai.api_key = OPENAI_API_KEY

# Set the correct path based on our debugging
COURSES_DIR = Path("/Users/dogamujde/Desktop/hacktheburghEdTech/scraped_data/courses")
print(f"Using courses directory: {COURSES_DIR}")

# Verify the path exists
if not COURSES_DIR.exists():
    print(f"❌ Error: Directory not found: {COURSES_DIR}")
    sys.exit(1)

# Print a few sample files to verify
print(f"Sample files in directory: {list(COURSES_DIR.glob('*.json'))[:3]}")

# Counters for statistics
total_courses = 0
courses_with_bullets = 0
processed_files = 0
updated_files = 0
errors = 0

def generate_course_bullets(summary, course_description):
    """
    Generates 3 bullet points for a course based on its description or summary.
    
    Args:
        summary (str): The summary of the course
        course_description (str): The detailed description of the course
        
    Returns:
        list: A list of 3 bullet points
    """
    # Use course_description if it's not empty or "Not entered", otherwise use summary
    text_to_analyze = course_description if course_description and course_description.strip() and course_description != "Not entered" else summary
    
    # If both inputs are empty, return placeholder bullets
    if not text_to_analyze or not text_to_analyze.strip():
        return [
            "• No course information available",
            "• Please check the course catalog for details",
            "• Contact the course administrator for more information"
        ]
    
    try:
        # Call the OpenAI API with specific instructions
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful academic assistant that creates concise bullet points about university courses."
                },
                {
                    "role": "user",
                    "content": f"""Generate EXACTLY 3 bullet points that summarize the key aspects of this course. 
                    Format each bullet point with a bullet character at the start (•).
                    Be concise and focus on what students will learn, key skills, or course highlights.
                    Return ONLY the 3 bullet points without any additional text or numbering.
                    
                    Course information: {text_to_analyze}"""
                }
            ],
            temperature=0.7,
            max_tokens=300,
        )
        
        # Extract the bullet points from the response
        content = response.choices[0].message.content.strip()
        
        # Split by newlines and filter out any empty lines
        bullets = [line.strip() for line in content.split('\n') if line.strip()]
        
        # Ensure each bullet starts with the bullet character
        bullets = [bullet if bullet.startswith('•') else f"• {bullet}" for bullet in bullets]
        
        # If we somehow got more or less than 3 bullets, pad or truncate
        while len(bullets) < 3:
            bullets.append("• Additional course information not available")
        
        # Take only the first 3 if we somehow got more
        bullets = bullets[:3]
        
        return bullets
        
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return [
            "• Error generating course information",
            "• Please try again later",
            "• Contact support if the problem persists"
        ]

def process_course_files():
    """
    Main function to process all course files.
    """
    global total_courses, courses_with_bullets, processed_files, updated_files, errors
    
    print(f"🔍 Scanning for course files in: {COURSES_DIR}")
    
    # Get all JSON files in the directory
    files = [f for f in COURSES_DIR.glob("*.json")]
    print(f"📊 Found {len(files)} JSON files to process")
    
    # Process each file with a progress bar
    for file_path in tqdm(files, desc="Processing files"):
        processed_files += 1
        
        try:
            print(f"Processing file: {file_path}")
            # Read and parse the file
            with open(file_path, 'r', encoding='utf-8') as f:
                courses = json.load(f)
            
            # Track if any course in this file was updated
            file_updated = False
            
            # Process each course in the file with a progress bar
            for course in tqdm(courses, desc=f"Courses in {file_path.name}", leave=False):
                total_courses += 1
                
                # Skip if the course already has bullet points
                if "bulletpoints" in course and course["bulletpoints"]:
                    courses_with_bullets += 1
                    continue
                
                try:
                    # Get summary and description for the course
                    summary = course.get("title", "") or course.get("name", "")
                    description = course.get("course_description", "")
                    
                    # Generate bullet points
                    bullet_points_list = generate_course_bullets(summary, description)
                    
                    # Convert the list to a single string with newlines
                    bulletpoints_string = "\n".join(bullet_points_list)
                    
                    # Add bullet points to the course as a single string
                    course["bulletpoints"] = bulletpoints_string
                    
                    # Mark file as updated
                    file_updated = True
                    courses_with_bullets += 1
                    
                    # Add small delay to avoid rate limiting
                    time.sleep(0.1)
                    
                    print(f"✅ Generated bullet points for {course.get('code', 'unknown')}: {summary}")
                except Exception as e:
                    print(f"❌ Error generating bullet points for {course.get('code', 'unknown')}: {e}")
                    errors += 1
            
            # If any course in this file was updated, save the file
            if file_updated:
                print(f"Writing updated data to {file_path}")
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(courses, f, indent=2, ensure_ascii=False)
                updated_files += 1
                print(f"💾 Saved updated file: {file_path.name}")
        except Exception as e:
            print(f"❌ Error processing file {file_path.name}: {e}")
            import traceback
            traceback.print_exc()
            errors += 1
    
    # Print summary
    print("\n📈 Summary:")
    print(f"   Files processed: {processed_files}")
    print(f"   Files updated: {updated_files}")
    print(f"   Total courses: {total_courses}")
    print(f"   Courses with bullet points: {courses_with_bullets}")
    print(f"   Errors: {errors}")

if __name__ == "__main__":
    try:
        process_course_files()
    except KeyboardInterrupt:
        print("\n\n⚠️ Process interrupted by user")
        print("\n📈 Summary so far:")
        print(f"   Files processed: {processed_files}")
        print(f"   Files updated: {updated_files}")
        print(f"   Total courses: {total_courses}")
        print(f"   Courses with bullet points: {courses_with_bullets}")
        print(f"   Errors: {errors}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1) 