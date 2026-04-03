#!/usr/bin/env python3
"""
Database initialization script for Interactive Story Platform
"""

import sqlite3
import os


CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))


def create_database():
    """Create database and tables"""
    db_path = os.path.join(CURRENT_DIR, "verse.db")
    
    # Read DDL from file or include it here
    ddl_file = os.path.join(CURRENT_DIR, "schemas.sql")
    
    if os.path.exists(db_path):
        print(f"Database {db_path} already exists. Delete it to recreate.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    with open(ddl_file, 'r') as ddl_file:
        for sql in ddl_file.read().split(';'):
            if sql.strip():
                cursor.execute(sql)
                conn.commit()
                print(f"Executed SQL: {sql.strip()}")
                print("############################################\n\n")

    print(f"Database {db_path} created successfully!")

    cursor.close()
    conn.close()


if __name__ == "__main__":
    create_database()
