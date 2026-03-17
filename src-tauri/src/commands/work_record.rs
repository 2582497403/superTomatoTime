use tauri::AppHandle;
use crate::database::{self, WorkRecord};
use crate::utils::get_db_path;

#[tauri::command]
pub fn save_work_record(app: AppHandle, record: WorkRecord) -> Result<(), String> {
    let db_path = get_db_path(&app)?;
    database::save_record(&db_path, &record).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_work_record(app: AppHandle, id: i64) -> Result<(), String> {
    let db_path = get_db_path(&app)?;
    database::delete_record(&db_path, id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_work_records(app: AppHandle) -> Result<Vec<WorkRecord>, String> {
    let db_path = get_db_path(&app)?;
    database::get_all_records(&db_path).map_err(|e: rusqlite::Error| e.to_string())
}
