import os
import glob

def concatenate_tex_files(root_dir, output_file):
    # Find all .tex files in the specified directory and its subdirectories
    tex_files = glob.glob(os.path.join(root_dir, '**', '*.tex'), recursive=True)
    
    # Sort the files to ensure consistent order
    tex_files.sort()
    
    # Open the output file in write mode
    with open(output_file, 'w', encoding='utf-8') as outfile:
        # Iterate through each .tex file
        for tex_file in tex_files:
            # Write the filename as a comment in the output file
            outfile.write(f"% File: {tex_file}\n")
            
            # Open and read the content of each .tex file
            with open(tex_file, 'r', encoding='utf-8') as infile:
                outfile.write(infile.read())
            
            # Add a newline between files for better readability
            outfile.write('\n\n')

# Set the root directory and output file path
root_directory = 'gto/manual/sections'
output_file_path = 'output.info'

# Call the function to concatenate the files
concatenate_tex_files(root_directory, output_file_path)

print(f"All .tex files have been concatenated into {output_file_path}")