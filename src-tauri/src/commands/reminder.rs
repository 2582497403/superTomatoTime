use crate::database::{self, Reminder, ReminderType};
use crate::utils::get_db_path;
use std::process::Command;
use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ReminderDto {
    pub id: Option<i32>,
    pub title: String,
    pub reminder_type: String, // "interval" or "scheduled"
    pub type_value: String,    // minutes for interval, time string for scheduled
    pub is_active: bool,
}

impl From<&Reminder> for ReminderDto {
    fn from(reminder: &Reminder) -> Self {
        let (reminder_type, type_value) = match &reminder.reminder_type {
            ReminderType::Interval(minutes) => ("interval".to_string(), minutes.to_string()),
            ReminderType::Scheduled(time) => ("scheduled".to_string(), time.clone()),
        };
        
        ReminderDto {
            id: reminder.id,
            title: reminder.title.clone(),
            reminder_type,
            type_value,
            is_active: reminder.is_active,
        }
    }
}

#[tauri::command]
pub fn get_reminders(app: AppHandle) -> Result<Vec<ReminderDto>, String> {
    let db_path = get_db_path(&app.app_handle()).map_err(|e| e.to_string())?;
    let reminders = database::get_all_reminders(&db_path).map_err(|e| e.to_string())?;
    Ok(reminders.iter().map(ReminderDto::from).collect())
}

#[tauri::command]
pub fn save_reminder(app: AppHandle, dto: ReminderDto) -> Result<(), String> {
    let db_path = get_db_path(&app.app_handle()).map_err(|e| e.to_string())?;
    
    let reminder_type = match dto.reminder_type.as_str() {
        "interval" => ReminderType::Interval(dto.type_value.parse().map_err(|_| "Invalid interval value")?),
        "scheduled" => ReminderType::Scheduled(dto.type_value),
        _ => return Err("Invalid reminder type".to_string()),
    };
    
    let reminder = Reminder {
        id: dto.id,
        title: dto.title,
        reminder_type,
        is_active: dto.is_active,
        created_at: None,
    };
    
    database::save_reminder(&db_path, &reminder).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_reminder(app: AppHandle, id: i32, dto: ReminderDto) -> Result<(), String> {
    let db_path = get_db_path(&app.app_handle()).map_err(|e| e.to_string())?;
    
    let reminder_type = match dto.reminder_type.as_str() {
        "interval" => ReminderType::Interval(dto.type_value.parse().map_err(|_| "Invalid interval value")?),
        "scheduled" => ReminderType::Scheduled(dto.type_value),
        _ => return Err("Invalid reminder type".to_string()),
    };
    
    let reminder = Reminder {
        id: Some(id),
        title: dto.title,
        reminder_type,
        is_active: dto.is_active,
        created_at: None,
    };
    
    database::update_reminder(&db_path, id, &reminder).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_reminder(app: AppHandle, id: i64) -> Result<(), String> {
    let db_path = get_db_path(&app.app_handle()).map_err(|e| e.to_string())?;
    database::delete_reminder(&db_path, id).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn toggle_reminder_active(app: AppHandle, id: i32, is_active: bool) -> Result<(), String> {
    let db_path = get_db_path(&app.app_handle()).map_err(|e| e.to_string())?;
    
    // 获取现有提醒
    let reminders = database::get_all_reminders(&db_path).map_err(|e| e.to_string())?;
    let reminder = reminders.iter().find(|r| r.id == Some(id))
        .ok_or("Reminder not found")?;
    
    // 更新激活状态
    database::update_reminder(&db_path, id, &Reminder {
        id: Some(id),
        title: reminder.title.clone(),
        reminder_type: reminder.reminder_type.clone(),
        is_active,
        created_at: None,
    }).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn trigger_reminder(app: AppHandle, title: String) -> Result<(), String> {
    // 显示系统通知
    app.notification()
        .builder()
        .title(title.clone())
        .body("提醒时间到了！")
        .show()
        .map_err(|e| e.to_string())?;
    
    // 调用 PowerShell 脚本显示弹窗
    let script_path = std::path::PathBuf::from("src-tauri/src/powershell/reminder.ps1");
    
    // 构建参数：标题、消息、持续时间（秒）
    let title_arg = format!("-Title '{}'", title.replace("'", "''"));
    let message_arg = "-Message '提醒时间到了！'";
    let duration_arg = "-Duration 4";
    
    Command::new("powershell")
        .arg("-ExecutionPolicy")
        .arg("Bypass")
        .arg("-File")
        .arg(&script_path)
        .arg(&title_arg)
        .arg(message_arg)
        .arg(duration_arg)
        .spawn()
        .map_err(|e| format!("Failed to execute PowerShell script: {}", e))?;
    
    Ok(())
}
