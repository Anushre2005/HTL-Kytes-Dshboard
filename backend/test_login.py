import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

conn = sqlite3.connect("kytes.db")
cursor = conn.cursor()
cursor.execute("SELECT username, hashed_password FROM users")
users = cursor.fetchall()
conn.close()

for username, hashed in users:
    print(f"User: {username}, Hash: {hashed}")
    try:
        if pwd_context.verify("kytes@2024", hashed):
            print("Password matches!")
        else:
            print("Password does NOT match!")
    except Exception as e:
        print("Error verifying:", str(e))
