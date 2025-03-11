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