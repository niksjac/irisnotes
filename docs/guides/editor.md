# Editor appearance and cursor

How to adjust the rich editor's look and its custom cursor. Verified against
source on 2026-10-04. The editor's document model is described in
[ADR-0005](../decisions/adr/ADR-0005-line-oriented-editor-schema.md); what it
can and can't do yet is listed in
[RFC-0004](../decisions/rfc/RFC-0004-onenote-style-editor.md).

## Changing settings

Open **Settings** with **Ctrl+Shift+,**. Changes apply immediately and are
saved in the `settings` table of `notes.db` (key `editor`), so they are per
device and can be exported and imported from the same view.

**Ctrl+E** switches a note between the rich editor (ProseMirror) and its HTML
source (CodeMirror).

| Setting | Default | Range / options |
|---|---|---|
| Font size | 14 px | 8–72 |
| Zoom | 1.0 | 0.5–3.0 |
| Font family | Arial, Helvetica, sans-serif | any CSS font-family |
| Line height | 1.6 | 1.2–2.5 |
| Paragraph spacing | 0.5 em | 0–2 |
| Letter spacing | 0 em | −0.1–0.5 |
| Editor padding | 16 px | 8–64 |
| Line wrapping | off | on / off |
| Active line highlight | on | on / off, with optional colour (empty = theme default) |
| Cursor colour | `#22c55e` | any colour |
| Cursor width | 2 px | 1, 2, 3 px or `block` |
| Cursor blink | `blink` | `blink`, `smooth`, `expand`, `solid` |
| Smooth cursor movement | on | on / off |

Ranges come from `EDITOR_SETTINGS_CONSTRAINTS` and defaults from
`DEFAULT_EDITOR_SETTINGS` in `apps/main/src/types/editor-settings.ts`.

Spacing also has hotkeys:

| Action | Keys |
|---|---|
| Line height up / down | Ctrl+Shift+Alt+↑ / ↓ |
| Letter spacing up / down | Ctrl+Shift+Alt+] / [ |
| Paragraph spacing up / down | Ctrl+Shift+Alt+PageUp / PageDown |

## How it works (for contributors)

- Settings live in `editorSettingsAtom` (persisted through
  `atomWithPersistence`, `apps/main/src/atoms/settings.ts`) and are read with
  `useEditorSettings()` (`apps/main/src/hooks/use-editor-settings.ts`).
- `applyEditorSettings()` writes them to CSS custom properties on `:root`:
  `--pm-font-size`, `--pm-zoom`, `--pm-font-family`, `--pm-line-height`,
  `--pm-block-spacing`, `--pm-letter-spacing`, `--pm-padding`,
  `--pm-caret-color`, `--pm-active-line-bg`, plus `--pm-cursor-width`. Editor CSS
  reads only these variables, so new appearance settings follow the same path.
- **Custom cursor** (`apps/main/src/components/editor/plugins/custom-cursor.ts`):
  the native caret is hidden and replaced by an absolutely positioned element,
  so it never shifts layout. Width and colour come from the CSS variables;
  blink style and block mode are classes on `:root`
  (e.g. `.pm-cursor-block-mode`).
- Older settings may store a font-family preset key (`system`, `serif`, `mono`,
  `inter`); `FONT_FAMILY_MAP` translates those. New values store the full CSS
  font-family string.
