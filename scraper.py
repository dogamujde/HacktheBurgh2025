import requests
from bs4 import BeautifulSoup
import logging
import json
from pathlib import Path
import csv
from typing import List, Dict, Tuple
import os
import time
import re
from urllib.parse import urljoin

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DRPSScraper:
    BASE_URL_CURRENT = "http://www.drps.ed.ac.uk/24-25"
    BASE_URL_PREVIOUS = "http://www.drps.ed.ac.uk/23-24"
    SCHOOLS_INDEX_URL_CURRENT = f"{BASE_URL_CURRENT}/dpt/cx_schindex.htm"
    SCHOOLS_INDEX_URL_PREVIOUS = f"{BASE_URL_PREVIOUS}/dpt/cx_schindex.htm"
    
    def __init__(self, debug=True, try_previous_year=True):
        self.session = requests.Session()
        self.debug = debug
        self.try_previous_year = try_previous_year
        
        # Create output directory
        self.output_dir = Path("scraped_data")
        self.output_dir.mkdir(exist_ok=True)
        
        # Create subdirectories for different data types
        self.colleges_dir = self.output_dir / "colleges"
        self.schools_dir = self.output_dir / "schools"
        self.courses_dir = self.output_dir / "courses"
        
        self.colleges_dir.mkdir(exist_ok=True)
        self.schools_dir.mkdir(exist_ok=True)
        self.courses_dir.mkdir(exist_ok=True)
        
        # Create debug directory if in debug mode
        if self.debug:
            self.debug_dir = self.output_dir / "debug"
            self.debug_dir.mkdir(exist_ok=True)
            logger.info(f"Debug mode enabled. HTML content will be saved to {self.debug_dir}")

        # Initialize data structures
        self.colleges = {}
        self.schools = {}
        self.courses = {}

    def fetch_page(self, url: str) -> BeautifulSoup:
        """Fetch a page and return its BeautifulSoup object. Try previous year if current year fails."""
        try:
            logger.info(f"Fetching page: {url}")
            response = self.session.get(url)
            response.raise_for_status()
            
            # In debug mode, save the HTML content
            if self.debug:
                # Create a filename based on the URL
                filename = url.replace("http://", "").replace("https://", "").replace("/", "_").replace(".", "_")
                debug_file = self.debug_dir / f"{filename}.html"
                with open(debug_file, 'w', encoding='utf-8') as f:
                    f.write(response.text)
                logger.info(f"Saved HTML content to {debug_file}")
            
            return BeautifulSoup(response.text, 'html.parser')
        except requests.RequestException as e:
            logger.error(f"Error fetching {url}: {str(e)}")
            
            # If we're trying the previous year and the URL is for the current year
            if self.try_previous_year and self.BASE_URL_CURRENT in url:
                previous_year_url = url.replace(self.BASE_URL_CURRENT, self.BASE_URL_PREVIOUS)
                logger.info(f"Trying previous year URL: {previous_year_url}")
                try:
                    response = self.session.get(previous_year_url)
                    response.raise_for_status()
                    
                    # In debug mode, save the HTML content
                    if self.debug:
                        # Create a filename based on the URL
                        filename = previous_year_url.replace("http://", "").replace("https://", "").replace("/", "_").replace(".", "_")
                        debug_file = self.debug_dir / f"{filename}.html"
                        with open(debug_file, 'w', encoding='utf-8') as f:
                            f.write(response.text)
                        logger.info(f"Saved HTML content to {debug_file}")
                    
                    # Update the current base URL to use the previous year for subsequent requests
                    self.BASE_URL_CURRENT = self.BASE_URL_PREVIOUS
                    return BeautifulSoup(response.text, 'html.parser')
                except requests.RequestException as e2:
                    logger.error(f"Error fetching previous year URL {previous_year_url}: {str(e2)}")
            
            raise

    def parse_colleges_and_schools(self, soup: BeautifulSoup) -> Dict[str, List[Dict[str, str]]]:
        """Parse the schools index page and extract college and school information."""
        logger.info("Parsing colleges and schools from main page")
        colleges = {}
        
        # Define the colleges we're looking for
        college_names = [
            "College of Arts, Humanities and Social Sciences",
            "College of Science and Engineering",
            "College of Medicine and Veterinary Medicine"
        ]
        
        # Initialize colleges dictionary
        for college_name in college_names:
            colleges[college_name] = []
            logger.info(f"Initialized college: {college_name}")
        
        # Based on the screenshots, we need to look for specific text patterns
        # and then find the associated lists of schools
        
        # First, let's find all text nodes that contain "College of"
        college_headers = []
        for text in soup.find_all(text=re.compile("College of")):
            if "College of" in text and len(text.strip()) > 10:  # Ensure it's a college name
                college_headers.append(text)
                logger.info(f"Found college header: {text.strip()}")
        
        # Now, for each college header, find the associated list of schools
        for i, header in enumerate(college_headers):
            # Get the parent element of the header
            parent = header.parent
            
            # Find the nearest college name in our predefined list
            college_name = None
            for name in college_names:
                if name in header:
                    college_name = name
                    break
            
            if not college_name:
                continue
            
            # Find the next unordered list after this header
            # We need to navigate up and then find the next ul
            current = parent
            while current and current.name != 'ul':
                # Try to find a ul in siblings
                next_ul = current.find_next_sibling('ul')
                if next_ul:
                    logger.info(f"Found school list for {college_name}")
                    self._process_school_list(next_ul, college_name, colleges)
                    break
                
                # If no ul found in siblings, move up to parent
                current = current.parent
        
        # If we still haven't found any schools, try a more direct approach
        if all(len(schools) == 0 for schools in colleges.values()):
            logger.info("Using alternative approach to find schools")
            
            # Find all unordered lists
            all_uls = soup.find_all('ul')
            
            # Process each ul and try to determine which college it belongs to
            for ul in all_uls:
                # Look at the text before this ul to determine the college
                prev_text = ""
                prev = ul.previous_element
                while prev and len(prev_text) < 200:  # Limit how far back we look
                    if hasattr(prev, 'text'):
                        prev_text = prev.text + prev_text
                    elif isinstance(prev, str):
                        prev_text = prev + prev_text
                    prev = prev.previous_element
                
                # Determine which college this ul belongs to
                college_name = None
                for name in college_names:
                    if name in prev_text:
                        college_name = name
                        break
                
                if college_name:
                    logger.info(f"Found school list for {college_name} (alternative method)")
                    self._process_school_list(ul, college_name, colleges)
        
        # If we still haven't found any schools, try a hardcoded approach based on the screenshots
        if all(len(schools) == 0 for schools in colleges.values()):
            logger.info("Using hardcoded approach to find schools")
            
            # Find all links that contain "Schedule"
            for link in soup.find_all('a', text=re.compile("Schedule")):
                text = link.get_text(strip=True)
                href = link.get('href')
                
                # Determine which college this school belongs to based on the screenshots
                college_name = None
                parent_text = ""
                
                # Get all text from parent elements
                current = link.parent
                while current and not college_name:
                    if hasattr(current, 'text'):
                        parent_text = current.text
                    
                    for name in college_names:
                        if name in parent_text:
                            college_name = name
                            break
                    
                    current = current.parent
                
                # If we couldn't determine the college, use a default
                if not college_name:
                    # Based on the position in the page, make an educated guess
                    if "Edinburgh College of Art" in text or "Divinity" in text:
                        college_name = "College of Arts, Humanities and Social Sciences"
                    elif "Engineering" in text or "Informatics" in text:
                        college_name = "College of Science and Engineering"
                    elif "Medicine" in text or "Veterinary" in text:
                        college_name = "College of Medicine and Veterinary Medicine"
                    else:
                        # Default to Arts if we can't determine
                        college_name = "College of Arts, Humanities and Social Sciences"
                
                # Extract schedule code
                schedule_code = ""
                if "(Schedule " in text:
                    name_parts = text.split("(Schedule ")
                    school_name = name_parts[0].strip()
                    schedule_code = "Schedule " + name_parts[1].strip(")")
                else:
                    school_name = text
                
                # Construct full URL
                base_url = self.BASE_URL_CURRENT
                full_url = f"{base_url}/dpt/{href}" if not href.startswith('http') else href
                
                # Extract code from URL
                code = ""
                if "cx_s_" in href:
                    code = href.split("cx_s_")[-1].replace(".htm", "")
                
                school_info = {
                    'name': school_name,
                    'url': full_url,
                    'college': college_name,
                    'schedule': schedule_code,
                    'code': code
                }
                
                colleges[college_name].append(school_info)
                logger.info(f"  - Found school: {school_name} ({schedule_code}) in {college_name}")
        
        # Print summary
        for college, schools in colleges.items():
            logger.info(f"College: {college} - {len(schools)} schools")
        
        return colleges
    
    def _process_school_list(self, ul_element, college_name, colleges_dict):
        """Process a list of schools for a specific college."""
        if not ul_element:
            return
        
        # Find all list items with links
        list_items = ul_element.find_all('li')
        
        for item in list_items:
            link = item.find('a')
            if not link:
                continue
                
            href = link.get('href')
            text = link.get_text(strip=True)
            
            # Skip empty links or navigation links
            if not text or not href or href.startswith('#'):
                continue
            
            # Extract schedule code if present
            schedule_code = ""
            if "(Schedule " in text:
                name_parts = text.split("(Schedule ")
                school_name = name_parts[0].strip()
                schedule_code = "Schedule " + name_parts[1].strip(")")
            else:
                school_name = text
            
            # Construct full URL
            if href.startswith('http'):
                full_url = href
            else:
                # Remove any leading slashes from href
                href = href.lstrip('/')
                full_url = f"{self.BASE_URL_CURRENT}/dpt/{href}"
            
            # Extract code from URL
            code = ""
            if "cx_s_" in href:
                code = href.split("cx_s_")[-1].replace(".htm", "")
            
            school_info = {
                'name': school_name,
                'url': full_url,
                'college': college_name,
                'schedule': schedule_code,
                'code': code
            }
            
            colleges_dict[college_name].append(school_info)
            logger.info(f"  - Found school: {school_name} ({schedule_code})")

    def parse_school_subjects(self, school_url: str, school_info: Dict[str, str]) -> List[Dict[str, str]]:
        """Parse a school page to extract subject areas."""
        try:
            logger.info(f"Parsing subjects for school: {school_info['name']}")
            soup = self.fetch_page(school_url)
            subjects = []
            
            # Based on the screenshot, subjects are in bullet points (list items)
            # First, look for all list items with links
            list_items = soup.find_all('li')
            
            for item in list_items:
                link = item.find('a')
                if not link:
                    continue
                
                href = link.get('href')
                text = link.get_text(strip=True)
                
                if not href or not text:
                    continue
                
                # Skip navigation links and links that are likely not subjects
                if 'index' in href.lower() or href.startswith('#') or 'search' in href.lower() or 'regulations' in href.lower():
                    continue
                
                # Construct full URL
                if href.startswith('http'):
                    full_url = href
                else:
                    # Remove any leading slashes from href
                    href = href.lstrip('/')
                    # Get the base URL (domain and path up to the last directory)
                    base_url = "/".join(school_url.split("/")[:-1])
                    full_url = f"{base_url}/{href}"
                
                subject_info = {
                    'name': text,
                    'url': full_url,
                    'school_name': school_info['name'],
                    'school_code': school_info['code'],
                    'college': school_info['college']
                }
                subjects.append(subject_info)
                logger.info(f"  - Found subject: {text}")
            
            # If we didn't find any subjects using the list items approach,
            # try looking for links directly in the main content area
            if not subjects:
                # Look for the main content area which might contain subjects
                main_content = soup.find('div', class_='content') or soup.find('td', class_='content')
                
                if main_content:
                    # Find all links in the main content
                    for link in main_content.find_all('a'):
                        href = link.get('href')
                        text = link.get_text(strip=True)
                        
                        if not href or not text:
                            continue
                        
                        # Skip navigation links and links that are likely not subjects
                        if 'index' in href.lower() or href.startswith('#') or 'search' in href.lower() or 'regulations' in href.lower():
                            continue
                        
                        # Construct full URL
                        if href.startswith('http'):
                            full_url = href
                        else:
                            # Remove any leading slashes from href
                            href = href.lstrip('/')
                            # Get the base URL (domain and path up to the last directory)
                            base_url = "/".join(school_url.split("/")[:-1])
                            full_url = f"{base_url}/{href}"
                        
                        subject_info = {
                            'name': text,
                            'url': full_url,
                            'school_name': school_info['name'],
                            'school_code': school_info['code'],
                            'college': school_info['college']
                        }
                        subjects.append(subject_info)
                        logger.info(f"  - Found subject (alternative method): {text}")
            
            # Remove duplicates based on subject name
            unique_subjects = []
            seen_names = set()
            
            for subject in subjects:
                if subject['name'] not in seen_names:
                    seen_names.add(subject['name'])
                    unique_subjects.append(subject)
            
            logger.info(f"  Total subjects found: {len(unique_subjects)}")
            return unique_subjects
        except Exception as e:
            logger.error(f"Error parsing subjects for school {school_info['name']}: {str(e)}")
            return []

    def parse_courses(self, subject_url: str, subject_info: Dict[str, str]) -> List[Dict[str, str]]:
        """Parse a subject page to extract courses."""
        try:
            logger.info(f"Parsing courses for subject: {subject_info['name']}")
            soup = self.fetch_page(subject_url)
            courses = []
            
            # Look for course tables - based on screenshots and common patterns
            tables = soup.find_all('table', class_='sitstablegrid') or soup.find_all('table')
            
            for table in tables:
                # Check if this is a course table by looking for headers
                headers = [th.get_text(strip=True).lower() for th in table.find_all('th')]
                
                # Skip tables that don't look like course tables
                if not headers or not any(header in ' '.join(headers).lower() for header in ['code', 'course', 'name']):
                    continue
                
                # Determine column indices based on headers
                code_idx = next((i for i, h in enumerate(headers) if 'code' in h.lower()), 0)
                availability_idx = next((i for i, h in enumerate(headers) if 'availability' in h.lower()), 1)
                name_idx = next((i for i, h in enumerate(headers) if 'course name' in h.lower() or 'name' in h.lower()), 2)
                period_idx = next((i for i, h in enumerate(headers) if 'period' in h.lower()), 3)
                credits_idx = next((i for i, h in enumerate(headers) if 'credit' in h.lower()), 4)
                
                # Course tables typically have rows with course codes and names
                rows = table.find_all('tr')
                
                for row in rows:
                    cells = row.find_all('td')
                    
                    # Skip header rows or rows with insufficient cells
                    if len(cells) <= max(code_idx, name_idx):
                        continue
                    
                    # Extract course code from the code column
                    course_code = cells[code_idx].get_text(strip=True) if code_idx < len(cells) else ""
                    
                    # Extract availability from the availability column
                    availability = cells[availability_idx].get_text(strip=True) if availability_idx < len(cells) else ""
                    
                    # Extract course name from the name column
                    course_name_cell = cells[name_idx] if name_idx < len(cells) else None
                    
                    course_url = ""
                    course_name = ""
                    
                    # Find link in the course name cell and extract the text from the link
                    if course_name_cell:
                        link = course_name_cell.find('a')
                        if link:
                            # Extract the course name from the link text
                            course_name = link.get_text(strip=True)
                            
                            # Get the URL
                            href = link.get('href')
                            if href:
                                # Construct full URL
                                if href.startswith('http'):
                                    course_url = href
                                else:
                                    # Remove any leading slashes from href
                                    href = href.lstrip('/')
                                    # Get the base URL (domain and path up to the last directory)
                                    base_url = "/".join(subject_url.split("/")[:-1])
                                    course_url = f"{base_url}/{href}"
                        else:
                            # If no link, use the cell text
                            course_name = course_name_cell.get_text(strip=True)
                    
                    # Extract other details if available
                    period = cells[period_idx].get_text(strip=True) if period_idx < len(cells) else ""
                    credits = cells[credits_idx].get_text(strip=True) if credits_idx < len(cells) else ""
                    
                    # Skip rows that don't have a proper course code or name
                    if not course_code or not course_name:
                        continue
                    
                    # Skip rows where the "course code" is actually a header or label
                    if "course" in course_code.lower() or "code" in course_code.lower():
                        continue
                    
                    # Skip rows that are likely legend/key information
                    if any(keyword in course_code.lower() for keyword in ['key', 'legend', 'available', 'not available']):
                        continue
                    
                    # Skip rows where the course code doesn't match the expected pattern (letters followed by numbers)
                    if not re.match(r'^[A-Z]{2,}[0-9]{4,}$', course_code):
                        continue
                    
                    # Create basic course info
                    course_info = {
                        'code': course_code,
                        'name': course_name,
                        'url': course_url,
                        'availability': availability,
                        'period': period,
                        'credits': credits,
                        'subject': subject_info['name'],
                        'school_name': subject_info['school_name'],
                        'college': subject_info['college']
                    }
                    
                    # If we have a course URL, fetch the detailed course page
                    if course_url:
                        try:
                            detailed_info = self.parse_course_details(course_url, course_info)
                            course_info.update(detailed_info)
                        except Exception as e:
                            logger.error(f"Error fetching detailed info for course {course_code}: {str(e)}")
                    
                    courses.append(course_info)
                    logger.info(f"  - Found course: {course_code} - {course_name}")
            
            # If we didn't find any courses using tables, try looking for links
            if not courses:
                # Look for links that might be courses
                for link in soup.find_all('a'):
                    href = link.get('href')
                    text = link.get_text(strip=True)
                    
                    if not href or not text:
                        continue
                    
                    # Skip navigation links
                    if 'index' in href.lower() or href.startswith('#'):
                        continue
                    
                    # Check if the link text or href contains a course code pattern (e.g., ARCH12345)
                    # Course codes often have a pattern of letters followed by numbers
                    course_code_pattern = re.compile(r'[A-Z]{2,}[0-9]{4,}')
                    
                    course_code_match = course_code_pattern.search(text) or course_code_pattern.search(href)
                    if course_code_match:
                        course_code = course_code_match.group(0)
                        course_name = text
                        
                        # Construct full URL
                        if href.startswith('http'):
                            course_url = href
                        else:
                            # Remove any leading slashes from href
                            href = href.lstrip('/')
                            # Get the base URL (domain and path up to the last directory)
                            base_url = "/".join(subject_url.split("/")[:-1])
                            course_url = f"{base_url}/{href}"
                        
                        # Create basic course info
                        course_info = {
                            'code': course_code,
                            'name': course_name,
                            'url': course_url,
                            'availability': "",
                            'period': "",
                            'credits': "",
                            'subject': subject_info['name'],
                            'school_name': subject_info['school_name'],
                            'college': subject_info['college']
                        }
                        
                        # If we have a course URL, fetch the detailed course page
                        if course_url:
                            try:
                                detailed_info = self.parse_course_details(course_url, course_info)
                                course_info.update(detailed_info)
                            except Exception as e:
                                logger.error(f"Error fetching detailed info for course {course_code}: {str(e)}")
                        
                        courses.append(course_info)
                        logger.info(f"  - Found course (alternative method): {course_code} - {course_name}")
            
            logger.info(f"  Total courses found: {len(courses)}")
            return courses
        except Exception as e:
            logger.error(f"Error parsing courses for subject {subject_info['name']}: {str(e)}")
            return []

    def parse_course_details(self, course_url: str, basic_info: Dict[str, str]) -> Dict[str, str]:
        """Parse a course page to extract detailed information."""
        try:
            logger.info(f"Parsing detailed info for course: {basic_info['code']} - {basic_info['name']}")
            soup = self.fetch_page(course_url)
            detailed_info = {}
            
            # Extract course title and code from the header
            course_header = soup.find('h1') or soup.find('h2')
            if course_header:
                detailed_info['full_title'] = course_header.get_text(strip=True)
            
            # Find all tables in the page
            tables = soup.find_all('table')
            
            for table in tables:
                # Look for table headers or captions to identify the table type
                caption = table.find('caption')
                caption_text = caption.get_text(strip=True) if caption else ""
                
                # Process different table types
                if "Course Outline" in caption_text:
                    self._extract_course_outline(table, detailed_info)
                elif "Entry Requirements" in caption_text:
                    self._extract_entry_requirements(table, detailed_info)
                elif "Course Delivery Information" in caption_text:
                    self._extract_delivery_info(table, detailed_info)
                elif "Information for Visiting Students" in caption_text:
                    self._extract_visiting_students_info(table, detailed_info)
                else:
                    # Generic table processing for tables without specific captions
                    self._extract_generic_table_info(table, detailed_info)
            
            # Extract course description
            course_description = soup.find('td', text=re.compile("Course description")) or soup.find('th', text=re.compile("Course description"))
            if course_description:
                # Get the next cell or row which contains the description
                next_cell = course_description.find_next('td')
                if next_cell:
                    detailed_info['course_description'] = next_cell.get_text(strip=True)
            
            # Extract summary if available
            summary_header = soup.find('td', text=re.compile("Summary")) or soup.find('th', text=re.compile("Summary"))
            if summary_header:
                next_cell = summary_header.find_next('td')
                if next_cell:
                    detailed_info['summary'] = next_cell.get_text(strip=True)
            
            return detailed_info
        except Exception as e:
            logger.error(f"Error parsing detailed info for course {basic_info['code']}: {str(e)}")
            return {}
    
    def _extract_course_outline(self, table, detailed_info):
        """Extract information from the Course Outline table."""
        rows = table.find_all('tr')
        
        for row in rows:
            cells = row.find_all(['th', 'td'])
            if len(cells) < 2:
                continue
            
            header = cells[0].get_text(strip=True)
            value = cells[1].get_text(strip=True)
            
            if "School" in header:
                detailed_info['school'] = value
            elif "Credit level" in header:
                detailed_info['credit_level'] = value
            elif "SCQF Credits" in header:
                detailed_info['scqf_credits'] = value
            elif "ECTS Credits" in header:
                detailed_info['ects_credits'] = value
            elif "Summary" in header:
                detailed_info['summary'] = value
            elif "Course description" in header:
                detailed_info['course_description'] = value
            elif "College" in header:
                detailed_info['college_detail'] = value
            elif "Availability" in header:
                detailed_info['availability_detail'] = value
    
    def _extract_entry_requirements(self, table, detailed_info):
        """Extract information from the Entry Requirements table."""
        rows = table.find_all('tr')
        
        for row in rows:
            cells = row.find_all(['th', 'td'])
            if len(cells) < 2:
                continue
            
            header = cells[0].get_text(strip=True)
            value = cells[1].get_text(strip=True)
            
            if "Pre-requisites" in header:
                detailed_info['pre_requisites'] = value
            elif "Co-requisites" in header:
                detailed_info['co_requisites'] = value
            elif "Prohibited Combinations" in header:
                detailed_info['prohibited_combinations'] = value
            elif "Other requirements" in header:
                detailed_info['other_requirements'] = value
            elif "Additional Costs" in header:
                detailed_info['additional_costs'] = value
    
    def _extract_delivery_info(self, table, detailed_info):
        """Extract information from the Course Delivery Information table."""
        rows = table.find_all('tr')
        
        for row in rows:
            cells = row.find_all(['th', 'td'])
            if len(cells) < 2:
                continue
            
            header = cells[0].get_text(strip=True)
            value = cells[1].get_text(strip=True)
            
            if "Academic year" in header:
                detailed_info['academic_year'] = value
            elif "Course Start" in header:
                detailed_info['course_start'] = value
            elif "Timetable" in header:
                detailed_info['timetable'] = value
            elif "Learning and Teaching activities" in header:
                detailed_info['learning_activities'] = value
            elif "Quota" in header:
                detailed_info['quota'] = value
    
    def _extract_visiting_students_info(self, table, detailed_info):
        """Extract information for visiting students."""
        rows = table.find_all('tr')
        
        for row in rows:
            cells = row.find_all(['th', 'td'])
            if len(cells) < 2:
                continue
            
            header = cells[0].get_text(strip=True)
            value = cells[1].get_text(strip=True)
            
            if "Pre-requisites" in header:
                detailed_info['visiting_prerequisites'] = value
            elif "High Demand Course" in header:
                detailed_info['high_demand'] = value
    
    def _extract_generic_table_info(self, table, detailed_info):
        """Extract information from tables without specific captions."""
        rows = table.find_all('tr')
        
        for row in rows:
            cells = row.find_all(['th', 'td'])
            if len(cells) < 2:
                continue
            
            header = cells[0].get_text(strip=True)
            value = cells[1].get_text(strip=True)
            
            # Convert header to a valid key name
            key = header.lower().replace(' ', '_').replace('/', '_').replace('(', '').replace(')', '')
            
            # Store the value
            detailed_info[key] = value

    def save_to_json(self, data, filename: str):
        """Save the scraped data to a JSON file."""
        try:
    with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"Data saved to {filename}")
        except IOError as e:
            logger.error(f"Error saving data to {filename}: {str(e)}")
            raise

    def scrape_all(self):
        """Main method to scrape all colleges, schools, subjects, and courses."""
        try:
            logger.info("Starting to scrape DRPS data...")
            
            # Step 1: Try to scrape colleges and schools from current year
            try:
                soup = self.fetch_page(self.SCHOOLS_INDEX_URL_CURRENT)
                colleges_data = self.parse_colleges_and_schools(soup)
            except Exception as e:
                logger.error(f"Error scraping current year: {str(e)}")
                logger.info("Trying previous year...")
                soup = self.fetch_page(self.SCHOOLS_INDEX_URL_PREVIOUS)
                colleges_data = self.parse_colleges_and_schools(soup)
            
            # Save colleges data
            all_colleges = []
            all_schools = []
            
            for college_name, schools in colleges_data.items():
                college_info = {
                    'name': college_name,
                    'schools_count': len(schools)
                }
                all_colleges.append(college_info)
                
                # Save individual college data
                college_filename = self.colleges_dir / f"{college_name.replace(' ', '_')}.json"
                self.save_to_json({'name': college_name, 'schools': schools}, college_filename)
                
                # Process each school
                for school in schools:
                    all_schools.append(school)
                    
                    # Save individual school data
                    school_filename = self.schools_dir / f"{school['code']}.json"
                    
                    # Step 2: Scrape subjects for each school
                    logger.info(f"Scraping subjects for school: {school['name']}")
                    subjects = self.parse_school_subjects(school['url'], school)
                    
                    # Add subjects to school data and save
                    school_data = {**school, 'subjects': subjects}
                    self.save_to_json(school_data, school_filename)
                    
                    # Step 3: Scrape courses for each subject
                    all_courses = []
                    for subject in subjects:
                        logger.info(f"Scraping courses for subject: {subject['name']}")
                        courses = self.parse_courses(subject['url'], subject)
                        all_courses.extend(courses)
                        
                        # Add a small delay to avoid overloading the server
                        time.sleep(0.5)
                    
                    # Save all courses for this school
                    # Use the school name instead of the code for the filename
                    school_name_for_filename = school['name'].replace(' ', '_').replace(',', '').replace('(', '').replace(')', '').replace('/', '_')
                    courses_filename = self.courses_dir / f"courses_{school_name_for_filename}.json"
                    self.save_to_json(all_courses, courses_filename)
            
            # Save summary files
            self.save_to_json(all_colleges, self.output_dir / "all_colleges.json")
            self.save_to_json(all_schools, self.output_dir / "all_schools.json")
            
            logger.info("Scraping completed successfully")
            return {
                'colleges_count': len(all_colleges),
                'schools_count': len(all_schools)
            }
        except Exception as e:
            logger.error(f"Error during scraping: {str(e)}")
            raise

    def parse_subjects(self, school_id, school_info):
        """Parse subjects for a school."""
        try:
            logger.info(f"Parsing subjects for school: {school_info['name']}")
            # Construct the full URL for the school page
            if school_info['url'].startswith('http'):
                school_url = school_info['url']
            else:
                # If the URL is relative, construct it properly
                school_url = f"{self.BASE_URL_CURRENT}/dpt/cx_s_{school_info['code']}.htm"
            
            soup = self.fetch_page(school_url)
            subjects = []
            
            # Find subject tables
            subject_tables = soup.find_all('table', class_='sitstablegrid')
            
            for table in subject_tables:
                caption = table.find('caption')
                if caption and "Subject area" in caption.text:
                    # Process subject rows
                    for row in table.find_all('tr'):
                        cells = row.find_all('td')
                        if len(cells) >= 2:
                            subject_code = cells[0].text.strip()
                            subject_name = cells[1].text.strip()
                            
                            if subject_code and subject_name:
                                subject_info = {
                                    'code': subject_code,
                                    'name': subject_name,
                                    'school_name': school_info['name'],
                                    'school_code': school_info['code'],
                                    'college': school_info['college']
                                }
                                subjects.append(subject_info)
                                logger.info(f"  - Found subject: {subject_name}")
            
            return subjects
        except Exception as e:
            logger.error(f"Error parsing subjects for school {school_info['name']}: {str(e)}")
            return []

def main():
    # Create scraper with debug mode enabled and try_previous_year set to True
    scraper = DRPSScraper(debug=True, try_previous_year=True)
    try:
        results = scraper.scrape_all()
        print(f"\nScraping completed successfully!")
        print(f"Scraped {results['colleges_count']} colleges and {results['schools_count']} schools")
        print(f"Data saved to the 'scraped_data' directory")
        print(f"HTML content saved to 'scraped_data/debug' directory for inspection")
    except Exception as e:
        logger.error(f"Scraping failed: {str(e)}")

if __name__ == "__main__":
    main() 