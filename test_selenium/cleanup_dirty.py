from db.db_helper import execute_query

print("=== user table ===")
rows = execute_query("SELECT id, username FROM `user` ORDER BY username")
print(f"Total: {len(rows)}")
for r in rows:
    print(f"  {r['username']:30} | id={r['id']}")

print("\n=== user_profile (orphans without user) ===")
orphans = execute_query(
    "SELECT up.id, up.email, up.phone, up.user_id "
    "FROM user_profile up "
    "LEFT JOIN `user` u ON u.id = up.user_id "
    "WHERE u.id IS NULL"
)
print(f"Orphan profiles: {len(orphans)}")
for r in orphans:
    print(f"  profile_id={r['id']} | user_id={r['user_id']} | email={r['email']}")
