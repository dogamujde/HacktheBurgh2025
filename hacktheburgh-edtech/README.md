# HackTheBurgh EdTech Project

This project is a web application that displays course information from the University of Edinburgh's Degree Regulations and Programmes of Study (DRPS) website. It consists of a Python scraper that extracts course data and a Next.js web application that displays the data.

## Project Structure

- `/scraper.py` - Python script that scrapes course data from the DRPS website
- `/scraped_data` - Directory where scraped data is stored
- `/hacktheburgh-edtech` - Next.js web application

## Backend Structure

The backend of the Next.js application is structured as follows:

- `/src/pages/api` - API routes for accessing the scraped data
  - `/courses.ts` - API route for course data
  - `/colleges.ts` - API route for college and school data
  - `/subjects.ts` - API route for subject data
- `/src/services` - Service functions for interacting with the API
  - `/api.ts` - Functions for fetching data from the API
- `/src/utils` - Utility functions
  - `/dataUtils.ts` - Functions for processing data
- `/src/config` - Configuration files
  - `/backend.ts` - Backend configuration
- `/src/scripts` - Scripts for running the scraper
  - `/runScraper.ts` - Script for running the scraper from the Next.js application

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Python 3.8 or later
- pip (Python package manager)

### Installation

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Install Node.js dependencies:

```bash
cd hacktheburgh-edtech
npm install
```

### Running the Scraper

To run the scraper and collect course data:

```bash
python scraper.py
```

This will create a `scraped_data` directory with the following structure:

- `/colleges` - College data
- `/schools` - School data
- `/courses` - Course data
- `/debug` - Debug HTML files (if debug mode is enabled)
- `all_colleges.json` - Summary of all colleges
- `all_schools.json` - Summary of all schools

### Running the Web Application

To run the Next.js web application:

```bash
cd hacktheburgh-edtech
npm run dev
```

This will start the development server at [http://localhost:3000](http://localhost:3000).

## API Routes

The web application provides the following API routes:

- `/api/courses` - Get course data
  - Query parameters:
    - `school` - Filter by school name
    - `subject` - Filter by subject name
    - `search` - Search in course name, code, or description
- `/api/colleges` - Get college and school data
  - Query parameters:
    - `college` - Filter schools by college name
- `/api/subjects` - Get subject data
  - Query parameters:
    - `school` - Filter by school name
    - `college` - Filter by college name

## License

This project is licensed under the MIT License - see the LICENSE file for details.
