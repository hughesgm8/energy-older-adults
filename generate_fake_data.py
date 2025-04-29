"""
This script was created to generate fake data based on existing CSV files in the `all-data` directory.
It requires data to be structured in a specific way, with each participant's / user's data stored in separate folders.
The data in each .CSV file must also be structured in a specific way, with the first column being the date and time, and the second column being the energy usage.
The script will copy the data from the P0 folder to P1, P2, and P3 folders, and then modify the energy usage values in the CSV files by multiplying them by a random factor between 0.8 and 1.2.
The purpose of this fake data was to be used for testing in the Participant Comparison service.
"""

import os
import csv
import random
from shutil import copytree

def create_fake_data(base_folder):
    p0_path = os.path.join(base_folder, 'P0')
    
    for participant in ['P1', 'P2', 'P3']:
        new_path = os.path.join(base_folder, participant)
        copytree(p0_path, new_path, dirs_exist_ok=True)
        
        for root, _, files in os.walk(new_path):
            for file in files:
                if file.endswith('.csv'):
                    csv_file = os.path.join(root, file)
                    new_rows = []
                    with open(csv_file, 'r', newline='') as f_in:
                        reader = csv.reader(f_in)
                        for row in reader:
                            if len(row) > 1:
                                try:
                                    usage = float(row[1])
                                    usage *= random.uniform(0.8, 1.2)
                                    row[1] = f"{usage:.3f}"
                                except ValueError:
                                    pass
                            new_rows.append(row)
                    with open(csv_file, 'w', newline='') as f_out:
                        writer = csv.writer(f_out)
                        writer.writerows(new_rows)

if __name__ == "__main__":
    base_folder = "/Users/gabrielmhughes/Documents/Energy Older Adults Project/energy-dashboard/all-data"
    create_fake_data(base_folder)