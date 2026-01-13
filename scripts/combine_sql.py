import os

def combine_sql_files(directory, output_file, header=None, footer=None, extra_files=[]):
    files = [f for f in os.listdir(directory) if f.endswith('.sql')]
    # Sort files naturally? The standard sort works for 001, 004, 017.
    # 001_full... comes before 004_...
    files.sort()
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        if header:
            outfile.write(header + "\n\n")
        
        # Write regular files
        for filename in files:
            filepath = os.path.join(directory, filename)
            print(f"Processing {filename}...")
            outfile.write(f"-- Source: {filename}\n")
            with open(filepath, 'r', encoding='utf-8') as infile:
                outfile.write(infile.read())
            outfile.write("\n\n")
            
        # Write extra files (like the generated one)
        for filepath in extra_files:
             if os.path.exists(filepath):
                print(f"Processing extra {filepath}...")
                outfile.write(f"-- Source: {filepath}\n")
                with open(filepath, 'r', encoding='utf-8') as infile:
                    outfile.write(infile.read())
                outfile.write("\n\n")

        if footer:
            outfile.write(footer + "\n")

# 1. Combine Schema
combine_sql_files(
    'database/migrations', 
    'leixi_init_schema.sql', 
    header="SET FOREIGN_KEY_CHECKS=0;", 
    footer="SET FOREIGN_KEY_CHECKS=1;"
)

# 2. Combine Test Data
combine_sql_files(
    'database/test-data', 
    'leixi_init_seed.sql', 
    header="SET FOREIGN_KEY_CHECKS=0;", 
    footer="SET FOREIGN_KEY_CHECKS=1;"
    # Note: 99_real_asset_data.sql is inside test-data now, so it will be picked up by listdir/sort
)
