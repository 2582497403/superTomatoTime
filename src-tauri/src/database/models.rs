use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkRecord {
    pub id: Option<i32>,
    pub round_number: i32,
    pub work_start_time: String,
    pub work_duration_minutes: i32,
    pub work_plan: Option<String>,
    pub work_summary: Option<String>,
    pub rest_start_time: Option<String>,
    pub rest_duration_minutes: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ReminderType {
    Interval(i32), // 循环提醒，存储分钟数
    Scheduled(String), // 定时提醒，存储时间字符串 "HH:mm"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Reminder {
    pub id: Option<i32>,
    pub title: String,
    pub reminder_type: ReminderType,
    pub is_active: bool,
    pub created_at: Option<String>,
}
