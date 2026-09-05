import os, json, sys

def write_files(manifest_path):
    with open(manifest_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for rel_path, content in data.items():
        full_path = os.path.normpath(rel_path)
        os.makedirs(os.path.dirname(os.path.abspath(full_path)), exist_ok=True)
        with open(full_path, 'w', encoding='utf-8') as out:
            out.write(content.strip() + '\n')
        print(f'Created: {full_path}')

if __name__ == '__main__':
    write_files(sys.argv[1])
