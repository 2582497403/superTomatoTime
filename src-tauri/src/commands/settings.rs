use tauri::AppHandle;
use crate::database;
use crate::utils::get_db_path;

#[tauri::command]
pub fn save_setting(app: AppHandle, key: String, value: String) -> Result<(), String> {
    let db_path = get_db_path(&app)?;
    database::set_setting(&db_path, &key, &value).map_err(|e: rusqlite::Error| e.to_string())
}

#[tauri::command]
pub fn get_setting(app: AppHandle, key: String) -> Result<Option<String>, String> {
    let db_path = get_db_path(&app)?;
    database::get_setting(&db_path, &key).map_err(|e: rusqlite::Error| e.to_string())
}
