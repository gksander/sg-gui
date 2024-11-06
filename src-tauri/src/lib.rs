use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::process::Command;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            exec_sg_query,
            replace_bytes_in_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn exec_sg_query(
    query: &str,
    language: &str,
    project_path: &str,
) -> Result<Vec<(String, Vec<SgGuiResultItem>)>, String> {
    // Parse yaml to json
    let rule_yaml: Result<serde_yaml::Value, serde_yaml::Error> = serde_yaml::from_str(query);
    let mut rule_yaml = match rule_yaml {
        Ok(rule_yaml) => rule_yaml,
        Err(e) => return Err(e.to_string()),
    };
    // And add in id/language
    rule_yaml["id"] = "default-rule".into();
    rule_yaml["language"] = language.into();

    let rule_json = match serde_json::to_string(&rule_yaml) {
        Ok(rule_json) => rule_json,
        Err(e) => return Err(e.to_string()),
    };

    // Execute sg and get results as JSON text
    let output = Command::new("sg")
        .arg("scan")
        .arg("--inline-rules")
        .arg(rule_json)
        .arg("--json=compact")
        .current_dir(project_path)
        .output();
    let output = match output {
        Ok(output) => output,
        Err(e) => return Err(e.to_string()),
    };

    let output_json: Result<Vec<SgResultRaw>, serde_json::Error> =
        serde_json::from_slice(&output.stdout);
    let output_json = match output_json {
        Ok(output_json) => output_json,
        Err(e) => return Err(e.to_string()),
    };

    // TODO: for each row, compute the diff and lines...
    let mut sg_gui_results: Vec<SgGuiResultItem> = Vec::new();
    for result in output_json {
        // Generate id and copy over other fields we need
        let mut sg_gui_result = SgGuiResultItem {
            id: format!(
                "{}:{}:{}",
                sg_gui_result.file,
                sg_gui_result.range.byte_offset.start,
                sg_gui_result.range.byte_offset.end,
            ),
            text: result.text,
            range: result.range,
            file: result.file,
            lines: result.lines,
            char_count: result.char_count,
            replacement: result.replacement,
            replacement_offsets: result.replacement_offsets,
            language: result.language,
        };

        sg_gui_results.push(sg_gui_result);
    }

    // Group by file, order results by byte offset, order files by name
    let mut file_results_hash: HashMap<String, Vec<SgGuiResultItem>> = HashMap::new();
    for result in sg_gui_results {
        file_results_hash
            .entry(result.file.clone())
            .or_default()
            .push(result);
    }
    for file_results in file_results_hash.values_mut() {
        file_results.sort_by_key(|result| result.range.byte_offset.start);
    }

    let mut file_results_vec: Vec<(String, Vec<SgGuiResultItem>)> =
        file_results_hash.into_iter().collect();
    file_results_vec.sort_by(|a, b| a.0.cmp(&b.0));

    Ok(file_results_vec)
}

/**
 * Replaces bytes in files.
 */
#[tauri::command]
fn replace_bytes_in_files(
    project_path: &str,
    replacements: std::collections::HashMap<&str, Vec<(u32, u32, &str)>>,
) -> Result<(), String> {
    for (file, bytes_to_replace) in replacements {
        let file_path = Path::new(project_path).join(file);
        let file_bytes = std::fs::read(&file_path).map_err(|e| e.to_string())?;

        let mut new_bytes = file_bytes.clone();
        let mut src_residual = 0;
        let mut dst_residual = 0;

        for (byte_offset_start, byte_offset_end, replacement) in bytes_to_replace {
            let start = byte_offset_start + dst_residual - src_residual;
            let end = byte_offset_end + dst_residual - src_residual;

            let replacement_bytes = replacement.as_bytes();
            new_bytes.splice(
                (start) as usize..(end) as usize,
                replacement_bytes.iter().cloned(),
            );

            src_residual += byte_offset_end - byte_offset_start;
            dst_residual += replacement_bytes.len() as u32;
        }

        std::fs::write(&file_path, new_bytes).map_err(|e| e.to_string())?;
    }

    Ok(())
}

/**
 * Misc types from sg's JSON output
 */
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SgResultRaw {
    text: String,
    range: Range,
    file: String,
    lines: String,
    char_count: CharCount,
    replacement: String,
    replacement_offsets: ReplacementOffsets,
    language: String,
}

#[derive(Serialize, Deserialize)]
pub struct CharCount {
    leading: i64,
    trailing: i64,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Range {
    byte_offset: ReplacementOffsets,
    start: End,
    end: End,
}

#[derive(Serialize, Deserialize)]
pub struct ReplacementOffsets {
    start: i64,
    end: i64,
}

#[derive(Serialize, Deserialize)]
pub struct End {
    line: i64,
    column: i64,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SgGuiResultItem {
    id: String,
    text: String,
    range: Range,
    file: String,
    lines: String,
    char_count: CharCount,
    replacement: String,
    replacement_offsets: ReplacementOffsets,
    language: String,
}
