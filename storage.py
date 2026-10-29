import json
import sqlite3
from pathlib import Path

# ==============================
# LƯU TRỮ BỀN VỮNG (SQLITE)
# ==============================

DB_PATH = Path(__file__).parent / "data" / "chatbot.db"


def get_connection():

    DB_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    conn = sqlite3.connect(DB_PATH)

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS visitors (
            session_id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS conversations (
            session_id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )

    return conn


# ==============================
# VISITOR PROFILE (dùng bởi app.py)
# ==============================

def save_visitor(session_id, profile):

    conn = get_connection()

    conn.execute(
        """
        INSERT INTO visitors (session_id, data, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(session_id) DO UPDATE SET
            data = excluded.data,
            updated_at = excluded.updated_at
        """,
        (
            session_id,
            json.dumps(profile, ensure_ascii=False)
        )
    )

    conn.commit()

    conn.close()


def load_all_visitors():

    conn = get_connection()

    rows = conn.execute(
        "SELECT session_id, data FROM visitors"
    ).fetchall()

    conn.close()

    return {
        session_id: json.loads(data)
        for session_id, data in rows
    }


# ==============================
# LỊCH SỬ HỘI THOẠI (dùng bởi chatbot.py)
# ==============================

def save_conversation(session_id, history):

    conn = get_connection()

    conn.execute(
        """
        INSERT INTO conversations (session_id, data, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(session_id) DO UPDATE SET
            data = excluded.data,
            updated_at = excluded.updated_at
        """,
        (
            session_id,
            json.dumps(history, ensure_ascii=False)
        )
    )

    conn.commit()

    conn.close()


def load_all_conversations():

    conn = get_connection()

    rows = conn.execute(
        "SELECT session_id, data FROM conversations"
    ).fetchall()

    conn.close()

    return {
        session_id: json.loads(data)
        for session_id, data in rows
    }
