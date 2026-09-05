import sys, os, base64
path = sys.argv[1]
chunk = base64.b64decode(sys.argv[2]).decode('utf-8')
os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
with open(path, 'a', encoding='utf-8') as f:
    f.write(chunk)
print('Appended to', path)
