# ⚠️ Carpeta legacy — no editar

**Esta carpeta NO es la app Koraa activa.**

| | App activa (TestFlight / desarrollo) | Esta carpeta (`koraav2/`) |
|---|--------------------------------------|---------------------------|
| Código | Raíz del repo: `app/`, `components/`, `lib/` | Copia antigua (~1.2 GB) |
| Build EAS | `app.config.js` en la raíz | No se usa |
| Bugs corregidos | Sí (UTC local, paywall, calendario, etc.) | Muchos fixes **no** aplicados aquí |

## Qué hacer

- **Editar solo** archivos en la raíz del monorepo (`/app`, `/components`, `/lib`, …).
- **No** ejecutar `npm install` ni `expo start` dentro de `koraav2/`.
- Si necesitas comparar algo viejo, copia el fragmento a la app activa — no desarrolles aquí.

## Eliminar en el futuro

Cuando ya no necesites referencia histórica, puedes borrar toda la carpeta `koraav2/` del disco (no afecta builds si solo trabajas en la raíz).

Documentación: [2026-05-19_koraav2_legacy_folder.md](../development_guidelines/learnings/2026-05-19_koraav2_legacy_folder.md)
