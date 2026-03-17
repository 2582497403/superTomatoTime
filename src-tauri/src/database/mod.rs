pub mod models;

use rusqlite::{Connection, Result};
use std::fs;
use std::path::Path;
pub use models::{WorkRecord, Reminder, ReminderType};

/// 初始化 SQLite 数据库（创建文件 + 建表）
pub fn initialize_database(db_path: &Path) -> Result<()> {
    if let Some(parent_dir) = db_path.parent() {
        fs::create_dir_all(parent_dir)
            .map_err(|e| rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CANTOPEN),
                Some(format!("创建数据库目录失败: {}", e)),
            ))?;
    }

    let conn = Connection::open(db_path)?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT NOT NULL,
            updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS work_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            round_number INTEGER NOT NULL,
            work_start_time TEXT NOT NULL,
            work_duration_minutes INTEGER NOT NULL,
            work_plan TEXT,
            work_summary TEXT,
            rest_start_time TEXT,
            rest_duration_minutes INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            reminder_type TEXT NOT NULL,
            type_value TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    Ok(())
}

pub fn save_record(db_path: &Path, record: &WorkRecord) -> Result<()> {
    let conn = Connection::open(db_path)?;
    conn.execute(
        "INSERT INTO work_records (
            round_number, work_start_time, work_duration_minutes, 
            work_plan, work_summary, rest_start_time, rest_duration_minutes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            record.round_number,
            &record.work_start_time,
            record.work_duration_minutes,
            &record.work_plan,
            &record.work_summary,
            &record.rest_start_time,
            record.rest_duration_minutes,
        ),
    )?;
    Ok(())
}

pub fn delete_record(db_path: &Path, id: i64) -> Result<()> {
    let conn = Connection::open(db_path)?;
    conn.execute("DELETE FROM work_records WHERE id = ?", [id])?;
    Ok(())
}

pub fn get_all_records(db_path: &Path) -> Result<Vec<WorkRecord>> {
    let conn = Connection::open(db_path)?;
    let mut stmt = conn.prepare(
        "SELECT id, round_number, work_start_time, work_duration_minutes, 
                work_plan, work_summary, rest_start_time, rest_duration_minutes 
         FROM work_records ORDER BY id DESC",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(WorkRecord {
            id: Some(row.get(0)?),
            round_number: row.get(1)?,
            work_start_time: row.get(2)?,
            work_duration_minutes: row.get(3)?,
            work_plan: row.get(4)?,
            work_summary: row.get(5)?,
            rest_start_time: row.get(6)?,
            rest_duration_minutes: row.get(7)?,
        })
    })?;

    let mut records = Vec::new();
    for row in rows {
        records.push(row?);
    }
    Ok(records)
}

pub fn set_setting(db_path: &Path, key: &str, value: &str) -> Result<()> {
    let conn = Connection::open(db_path)?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, strftime('%s', 'now'))",
        (key, value),
    )?;
    Ok(())
}

pub fn get_setting(db_path: &Path, key: &str) -> Result<Option<String>> {
    let conn = Connection::open(db_path)?;
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?")?;
    let mut rows = stmt.query([key])?;
    if let Some(row) = rows.next()? {
        return Ok(Some(row.get(0)?));
    }
    Ok(None)
}

// ==================== Reminder CRUD ====================

pub fn save_reminder(db_path: &Path, reminder: &Reminder) -> Result<()> {
    let conn = Connection::open(db_path)?;
    
    let (reminder_type, type_value) = match &reminder.reminder_type {
        ReminderType::Interval(minutes) => ("interval", minutes.to_string()),
        ReminderType::Scheduled(time) => ("scheduled", time.clone()),
    };
    
    conn.execute(
        "INSERT INTO reminders (title, reminder_type, type_value, is_active) VALUES (?, ?, ?, ?)",
        (&reminder.title, reminder_type, type_value, if reminder.is_active { 1 } else { 0 }),
    )?;
    Ok(())
}

pub fn update_reminder(db_path: &Path, id: i32, reminder: &Reminder) -> Result<()> {
    let conn = Connection::open(db_path)?;
    
    let (reminder_type, type_value) = match &reminder.reminder_type {
        ReminderType::Interval(minutes) => ("interval", minutes.to_string()),
        ReminderType::Scheduled(time) => ("scheduled", time.clone()),
    };
    
    conn.execute(
        "UPDATE reminders SET title = ?, reminder_type = ?, type_value = ?, is_active = ? WHERE id = ?",
        (&reminder.title, reminder_type, type_value, if reminder.is_active { 1 } else { 0 }, id),
    )?;
    Ok(())
}

pub fn delete_reminder(db_path: &Path, id: i64) -> Result<()> {
    let conn = Connection::open(db_path)?;
    conn.execute("DELETE FROM reminders WHERE id = ?", [id])?;
    Ok(())
}

pub fn get_all_reminders(db_path: &Path) -> Result<Vec<Reminder>> {
    let conn = Connection::open(db_path)?;
    let mut stmt = conn.prepare(
        "SELECT id, title, reminder_type, type_value, is_active, created_at 
         FROM reminders ORDER BY id DESC",
    )?;
    let rows = stmt.query_map([], |row| {
        let id: i32 = row.get(0)?;
        let title: String = row.get(1)?;
        let reminder_type: String = row.get(2)?;
        let type_value: String = row.get(3)?;
        let is_active: bool = row.get::<_, i32>(4)? != 0;
        let created_at: Option<String> = row.get(5)?;
        
        let reminder_type_enum = match reminder_type.as_str() {
            "interval" => ReminderType::Interval(type_value.parse().unwrap_or(0)),
            "scheduled" => ReminderType::Scheduled(type_value),
            _ => ReminderType::Interval(0),
        };
        
        Ok(Reminder {
            id: Some(id),
            title,
            reminder_type: reminder_type_enum,
            is_active,
            created_at,
        })
    })?;

    let mut reminders = Vec::new();
    for row in rows {
        reminders.push(row?);
    }
    Ok(reminders)
}
