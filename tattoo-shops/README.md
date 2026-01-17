# Tattoo Shops - Python Data Processing

Python-based tattoo shop data processing and analysis project.

## Overview

This project processes and analyzes tattoo shop data from various sources, including Louisiana and USA-wide tattoo parlor databases.

## Tech Stack

- Python
- Backend API (Flask/FastAPI)
- Data processing (CSV files)
- Testing with pytest

## Project Structure

```
tattoo-shops/
├── backend/              # Backend API implementation
│   ├── server.py        # Main server file
│   ├── import_shops.py  # Shop data importer
│   └── requirements.txt # Python dependencies
├── frontend/            # Frontend application
├── backend_test.py      # Backend tests
├── louisiana_shops.csv  # Louisiana tattoo shops data
└── usa_tattoo_parlors_final.csv  # USA tattoo parlors database
```

## Getting Started

### Prerequisites

- Python 3.8 or higher
- pip

### Installation

1. Navigate to this directory:
```bash
cd tattoo-shops
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

### Running the Backend

```bash
cd backend
python server.py
```

### Running Tests

```bash
python backend_test.py
```

## Data Files

- `louisiana_shops.csv` - Contains Louisiana tattoo shop data
- `usa_tattoo_parlors_final.csv` - Contains USA-wide tattoo parlor information

## Development

This project is part of a monorepo. See the root README.md for more information about the overall repository structure.
