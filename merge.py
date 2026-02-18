#!/usr/bin/env python3
import os
import subprocess

os.chdir('/Users/victorlobanov/Documents/IT/Projects/mkdocs-versions-plugin')

# Удаляем swap файлы
for f in ['.git/.COMMIT_EDITMSG.swp', '.git/.MERGE_MSG.swp']:
    try:
        os.remove(f)
        print(f"Deleted {f}")
    except:
        pass

# Переключаемся на master и мержим
os.environ['GIT_EDITOR'] = 'true'
os.environ['EDITOR'] = 'true'

result = subprocess.run(['git', 'checkout', 'master'], capture_output=True, text=True)
print(f"Checkout result: {result.stdout} {result.stderr}")

result = subprocess.run(['git', 'merge', 'dev', '--no-edit'], capture_output=True, text=True)
print(f"Merge result: {result.stdout} {result.stderr}")

# Проверяем статус
result = subprocess.run(['git', 'status'], capture_output=True, text=True)
print(f"Status: {result.stdout} {result.stderr}")
