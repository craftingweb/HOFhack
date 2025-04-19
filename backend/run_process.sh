#!/bin/bash

# This script runs the PDF processing tool with the specified claim ID

# Set executable permissions
chmod +x get_and_process_pdfs.py

# Run the script with the claim ID
echo "Running PDF processor for claim ID 6803989cb5170ea2ce83b047..."
python get_and_process_pdfs.py 6803989cb5170ea2ce83b047

# Alternatively, you can run it with a different claim ID
# python get_and_process_pdfs.py MH-2023-TEST1 