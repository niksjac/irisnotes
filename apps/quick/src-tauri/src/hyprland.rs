//! Resizing the launcher under Hyprland.
//!
//! Hyprland ignores a floating window resizing itself (GTK's resize changes
//! nothing on screen), so the launcher asks the compositor over its IPC
//! socket instead. It keeps the top-left corner where it is: Hyprland's
//! resize grows a window around its centre, which would make the input jump.
//! It also turns off animations for the window: with them the frame glides
//! to each new size while the content changes at once, which looks like
//! jumping.
//!
//! Hyprland with a Lua config only accepts Lua dispatchers
//! (`hl.dsp.window.resize({...})`); with a hyprlang config only the classic
//! ones (`resizewindowpixel exact W H,pid:P`). Lua is tried first.

use std::io::{Read, Write};
use std::os::unix::net::UnixStream;
use std::path::PathBuf;
use std::time::Duration;

fn socket_path() -> Option<PathBuf> {
    let signature = std::env::var_os("HYPRLAND_INSTANCE_SIGNATURE")?;
    let runtime = std::env::var_os("XDG_RUNTIME_DIR")?;
    Some(PathBuf::from(runtime).join("hypr").join(signature).join(".socket.sock"))
}

/// One request on Hyprland's command socket; None when it can't be reached
fn request(command: &str) -> Option<String> {
    let mut stream = UnixStream::connect(socket_path()?).ok()?;
    let timeout = Some(Duration::from_millis(300));
    stream.set_read_timeout(timeout).ok()?;
    stream.set_write_timeout(timeout).ok()?;
    stream.write_all(command.as_bytes()).ok()?;
    let mut reply = String::new();
    stream.read_to_string(&mut reply).ok()?;
    Some(reply)
}

/// Run dispatchers in one batch, so the compositor applies them together
/// (no frame in between). Lua form first, then the classic one.
fn dispatch_batch(lua: &[String], classic: &[String]) -> bool {
    let run = |commands: &[String]| {
        let batch = commands
            .iter()
            .map(|c| format!("dispatch {c}"))
            .collect::<Vec<_>>()
            .join("; ");
        request(&format!("[[BATCH]]{batch}"))
            .is_some_and(|reply| reply.split("\n\n\n").all(|part| part.trim() == "ok"))
    };
    run(lua) || run(classic)
}

/// Position and size of this process's mapped window, in layout pixels
fn window_geometry(pid: u32) -> Option<([i64; 2], [i64; 2])> {
    let clients: serde_json::Value = serde_json::from_str(&request("j/clients")?).ok()?;
    let client = clients
        .as_array()?
        .iter()
        .find(|c| c["pid"].as_u64() == Some(pid as u64) && c["mapped"].as_bool() != Some(false))?;
    let pair = |key: &str| -> Option<[i64; 2]> {
        let v = client[key].as_array()?;
        Some([v.first()?.as_i64()?, v.get(1)?.as_i64()?])
    };
    Some((pair("at")?, pair("size")?))
}

/// Resize this process's window to `width`×`height`, keeping its top-left
/// corner. Returns false when not running under Hyprland, or when the window
/// isn't on screen (hidden): the caller's own resize then applies on show.
pub fn resize_keeping_top(width: u32, height: u32) -> bool {
    if socket_path().is_none() {
        return false;
    }
    let pid = std::process::id();
    let Some(([x, y], [w, h])) = window_geometry(pid) else {
        return false;
    };
    if w == width as i64 && h == height as i64 {
        return true;
    }
    let window = format!("pid:{pid}");
    // Resize grows around the centre; the move in the same batch puts the
    // top-left corner back before anything is drawn. no_anim is set each time
    // because Hyprland forgets it when the window is hidden and shown again.
    dispatch_batch(
        &[
            format!("hl.dsp.window.set_prop({{ prop = \"no_anim\", value = \"1\", window = \"{window}\" }})"),
            format!("hl.dsp.window.resize({{ x = {width}, y = {height}, window = \"{window}\" }})"),
            format!("hl.dsp.window.move({{ x = {x}, y = {y}, window = \"{window}\" }})"),
        ],
        &[
            format!("setprop {window} no_anim 1"),
            format!("resizewindowpixel exact {width} {height},{window}"),
            format!("movewindowpixel exact {x} {y},{window}"),
        ],
    )
}
