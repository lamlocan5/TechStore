# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open(r"C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\data\data_user\seed_users.sql", encoding="utf-8") as f:
    content = f.read()

pattern = r"'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'"
matches = re.findall(pattern, content)
uuids = list(dict.fromkeys(matches))
print(f"Total unique UUIDs: {len(uuids)}")
# UUIDs xuất hiện 2 lần mỗi user (user + user_profile), lấy một nửa đầu = user_id
user_ids = uuids[:100]
print("First 3 user_ids:")
for uid in user_ids[:3]:
    print(f"  {uid}")
