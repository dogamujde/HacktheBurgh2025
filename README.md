# University of Edinburgh DRPS Scraper

A web scraper for the University of Edinburgh's Degree Regulations & Programmes of Study (DRPS) website.

## Features

- Scrapes the complete hierarchical structure of the DRPS website:
  - Colleges
  - Schools
  - Subject areas
  - Courses
- Saves data in JSON format for easy processing
- Organizes data in a structured directory hierarchy

## Requirements

- Python 3.6+
- Required packages:
  - beautifulsoup4
  - requests

## Installation

1. Clone this repository
2. Install the required packages:

```bash
pip install -r requirements.txt
```

## Usage

Run the scraper with:

```bash
python scraper.py
```

The scraper will:
1. Create a `scraped_data` directory with subdirectories for colleges, schools, and courses
2. Scrape all colleges and their schools from the main DRPS page
3. For each school, scrape all subject areas
4. For each subject area, scrape all courses
5. Save the data in JSON files in the appropriate directories

## Output Structure

```
scraped_data/
├── all_colleges.json       # Summary of all colleges
├── all_schools.json        # Summary of all schools
├── colleges/               # Individual college data
│   ├── College_of_Arts_Humanities_and_Social_Sciences.json
│   ├── College_of_Medicine_and_Veterinary_Medicine.json
│   └── College_of_Science_and_Engineering.json
├── schools/                # Individual school data with subjects
│   ├── su151.json
│   ├── su161.json
│   └── ...
└── courses/               # Course data for each school
    ├── courses_su151.json
    ├── courses_su161.json
    └── ...
```

## Data Format

### College Data
```json
{
  "name": "College of Arts, Humanities and Social Sciences",
  "schools": [
    {
      "name": "School of Divinity",
      "url": "http://www.drps.ed.ac.uk/24-25/dpt/cx_s_su151.htm",
      "college": "College of Arts, Humanities and Social Sciences",
      "schedule": "Schedule B",
      "code": "su151"
    },
    ...
  ]
}
```

### School Data
```json
{
  "name": "School of Divinity",
  "url": "http://www.drps.ed.ac.uk/24-25/dpt/cx_s_su151.htm",
  "college": "College of Arts, Humanities and Social Sciences",
  "schedule": "Schedule B",
  "code": "su151",
  "subjects": [
    {
      "name": "Biblical Studies",
      "url": "http://www.drps.ed.ac.uk/24-25/dpt/cx_s_su151.htm#Biblical Studies",
      "school_name": "School of Divinity",
      "school_code": "su151",
      "college": "College of Arts, Humanities and Social Sciences"
    },
    ...
  ]
}
```

### Course Data
```json
[
  {
    "code": "BIST08001",
    "name": "Biblical Ethics",
    "url": "http://www.drps.ed.ac.uk/24-25/dpt/cxbist08001.htm",
    "availability": "SS1",
    "period": "Semester 1",
    "credits": "20",
    "subject": "Biblical Studies",
    "school_name": "School of Divinity",
    "college": "College of Arts, Humanities and Social Sciences"
  },
  ...
]
```

## License

This project is for educational purposes only. Please respect the University of Edinburgh's terms of service when using this scraper.
