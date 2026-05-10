# -*- coding: utf-8 -*-
import sys; sys.stdout.reconfigure(encoding='utf-8')
import re, collections

with open('seed_orders.sql', encoding='utf-8') as f:
    content = f.read()

months = re.findall(r'2026-(\d{2})-\d{2} \d{2}:\d{2}:\d{2}', content)
count  = collections.Counter(months)
print('Phan bo don theo thang 2026:')
for m, c in sorted(count.items()):
    print(f'  Thang {m}: {c} timestamps')

pattern = r"'(PENDING|PAID|SHIPPING|COMPLETED|CANCELLED)'"
statuses = re.findall(pattern, content)
s_count = collections.Counter(statuses)
print('Phan bo status (trong orders):')
for s, c in s_count.items():
    print(f'  {s}: {c}')
