import sqlite3
import json
import datetime
from config import DB_PATH, FEATURE_KEYS

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS baselines (
            user_id TEXT PRIMARY KEY,
            sample_count INTEGER NOT NULL,
            means_json TEXT NOT NULL,
            stds_json TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_vectors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            features_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_vectors_user ON user_vectors(user_id)")
    conn.commit()
    conn.close()

def get_baseline(user_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT sample_count, means_json, stds_json FROM baselines WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "sample_count": row["sample_count"],
        "means": json.loads(row["means_json"]),
        "stds": json.loads(row["stds_json"])
    }

def save_baseline(user_id: str, means: dict, stds: dict, sample_count: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO baselines (user_id, sample_count, means_json, stds_json, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
            sample_count = excluded.sample_count,
            means_json = excluded.means_json,
            stds_json = excluded.stds_json,
            updated_at = CURRENT_TIMESTAMP
    """, (user_id, sample_count, json.dumps(means), json.dumps(stds)))
    conn.commit()
    conn.close()

def add_vector(user_id: str, features: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO user_vectors (user_id, features_json)
        VALUES (?, ?)
    """, (user_id, json.dumps(features)))
    
    # Prune old vectors beyond the most recent 200
    cursor.execute("""
        DELETE FROM user_vectors
        WHERE user_id = ? AND id NOT IN (
            SELECT id FROM user_vectors WHERE user_id = ? ORDER BY id DESC LIMIT 200
        )
    """, (user_id, user_id))
    
    conn.commit()
    conn.close()

def get_recent_vectors(user_id: str, limit: int = 10):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT features_json FROM user_vectors
        WHERE user_id = ?
        ORDER BY id DESC LIMIT ?
    """, (user_id, limit))
    rows = cursor.fetchall()
    conn.close()
    # Return in chronological order (oldest to newest)
    return [json.loads(r["features_json"]) for r in reversed(rows)]

def get_vector_count(user_id: str) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) AS cnt FROM user_vectors WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return row["cnt"] if row else 0

# Auto-initialize on import
init_db()