use std::path::Path;

#[tauri::command]
pub fn replace_bytes_in_files(
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
