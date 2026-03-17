mod database;
mod commands;
mod utils;

use utils::get_db_path;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // 初始化数据库
            let db_path = get_db_path(&app.handle())?;
            database::initialize_database(&db_path).map_err(|e: rusqlite::Error| e.to_string())?;

            Ok(())
        })
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::save_work_record, 
            commands::delete_work_record,
            commands::get_work_records, 
            commands::show_mac_notification,
            commands::save_setting,
            commands::get_setting,
            commands::set_always_on_top,
            commands::get_reminders,
            commands::save_reminder,
            commands::update_reminder,
            commands::delete_reminder,
            commands::trigger_reminder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
