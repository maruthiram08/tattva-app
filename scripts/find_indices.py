
import csv

INPUT_FILE = "projectdocs/Transformed_Final_Output - finalfixllmoutput.csv"

def find_indices():
    t2_indices = []
    t3_indices = []
    
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            template = row.get('template', '').strip()
            query = row.get('user_query', '')
            
            if 'T2' in template or template == 'T2':
                t2_indices.append(i)
            elif 'T3' in template or template == 'T3':
                t3_indices.append(i)
            elif "Why a question is refused" in row.get('classification', ''):
                t3_indices.append(i)
                
    print(f"Total Rows Checked: {i+1}")
    print(f"T2 Indices ({len(t2_indices)}): {t2_indices}")
    print(f"T3 Indices ({len(t3_indices)}): {t3_indices}")

if __name__ == "__main__":
    find_indices()
