import os, json, sys, base64

def run_batch(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    for path, b64_content in manifest.items():
        norm_path = os.path.normpath(path)
        os.makedirs(os.path.dirname(os.path.abspath(norm_path)), exist_ok=True)
        raw_content = base64.b64decode(b64_content).decode('utf-8')
        with open(norm_path, 'w', encoding='utf-8') as out:
            out.write(raw_content.strip() + '\n')
        print(f'Created: {norm_path}')

if __name__ == '__main__':
    run_batch(sys.argv[1])
