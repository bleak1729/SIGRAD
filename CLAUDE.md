# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Versión

**Versión actual:** V1.0.221
**Última actualización:** 2026-05-24

> Cada vez que se modifique `index.html`, el hook `.claude/bump-version.js` incrementa automáticamente el número de parche y registra la fecha en este archivo.

---

## Project Overview

**SISTEMA_PCAD** (SIGRAD) es una SPA de gestión de riesgos y desastres en tiempo real para el Centro de Comando y Control de Protección Civil Lagunillas. Monitorea inspecciones, incidentes y operaciones mediante 31 colecciones de Firestore.

**Preferencias del proyecto:** responder siempre en español.
**Design system:** Fluent UI 9 — fondo blanco, azul `#0078d4`, `border-radius:4-8px`, sin glassmorphism.

---

## Estado de los archivos principales

| Archivo | Rol | Estado |
|---------|-----|--------|
| `index.html` | **Producción activa** — SPA principal (~11,500 líneas) | ✅ Activo, modificable |
| `modules/usuarios.js` | Módulo de Gestión de Usuarios (cargado como `<script defer>`) | ✅ Activo |
| `Monitoreo_Clima.html` | Módulo Clima — cargado como iframe en vista "Alerta Temprana" | ✅ Activo |
| `Monitoreo_sismos.html` | Módulo Sismos — cargado como iframe en vista "Sismos" | ✅ Activo |
| `server.js` | Servidor Express local — solo proxy de sismos API | ✅ Solo dev local |
| `logo.png` | Favicon + logo sidebar | ✅ Activo |
| `cors.json` | Firebase Storage CORS config | ✅ Activo |

> **Nota:** `index_new.html` y `migracion.md` fueron movidos a `_archivo/`. El rediseño Fluent UI 9 se aplicó directamente sobre `index.html`. No existe migración activa.

---

## Commands

```bash
npm install          # Instalar dependencias (express, cors)
npm start            # Servidor Express en http://localhost:3000
firebase deploy      # Deploy a Firebase Hosting (proyecto: gestionriesgoslagunillas)
```

Sin suite de tests automatizados. Pruebas manuales en el navegador.

---

## Architecture

### index.html (única SPA de producción)

| Sección | Contenido |
|---------|-----------|
| `<head>` | Meta tags, CDN libs con `defer` |
| `<style>` | Sistema de diseño Fluent UI 9 completo |
| `<body>` | Login + shell (sidebar + vistas) + modales |
| `<script type="module">` | Firebase + toda la lógica de la app |

### Vistas del sidebar

**Centro de Mando:**
- `dashboard-analytics` — Dashboard con KPIs, gráficos Chart.js, mapa analítico
- `resumen` — Situación General (mapa monitoreo, bitácora, bandeja de reportes)
- `mapa` — Mapa Táctico (Leaflet, tile CartoDB Light, filtros por coordinación)
- `recursos` — Gestión de Recursos (calendario de guardias, personal, flota, drones)
- `biblioteca` — Biblioteca Digital (cards Fluent, paginación 100/página)
- `papelera` — Papelera de Reciclaje
- `reinspeccion` — Reinspecciones (casos >30 días sin resolver)

**Monitoreo:**
- `alerta` → iframe `Monitoreo_Clima.html` — Clima (Windy, reporte PCAD, alerta)
- `sismos` → iframe `Monitoreo_sismos.html` — Sismos (API sismosve, historial, RainViewer)

**Administración:**
- `admin` — Gestión de Usuarios
- `support-history` — Incidencias (tickets soporte)

### Librerías CDN
- **Leaflet** + MarkerCluster — mapas interactivos
- **Chart.js** — gráficas estadísticas
- **jsPDF** + autotable — generación de PDFs
- **Toastify** — notificaciones toast
- **html2canvas** — capturas de pantalla
- **Lucide** — íconos SVG

### Flujo de datos
```
Firebase Firestore (31 colecciones)
  → onSnapshot listeners
  → window.allData[]      (fuente única de verdad)
  → funciones render*()
  → DOM via innerHTML
```

### Backend (`server.js`) — solo desarrollo local
```
GET /           → index.html
GET /proxy/sismos → proxy a sismosve.rafnixg.dev/api/sismos (evita CORS)
```

> **No hay PostgreSQL.** Toda la data es Firebase Firestore.

---

## Key Patterns

### Notificaciones — `window.notify(msg, type)`
```javascript
window.notify("Mensaje", 'success')   // verde
window.notify("Mensaje", 'error')     // rojo
window.notify("Mensaje", 'warning')   // naranja
window.notify("Mensaje", 'info')      // azul
```

### Modales Fluent UI 9
Todos los modales siguen el mismo patrón:
```html
<div id="modal-X" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);z-index:XXXX;justify-content:center;align-items:center;">
  <div style="width:min(XXXpx,95vw);border-radius:8px;background:var(--bg-card);border:1px solid var(--border);box-shadow:0 8px 40px rgba(0,0,0,0.22);">
    <!-- header + body + footer -->
  </div>
</div>
```
Apertura: `modal.style.display='flex'; setTimeout(()=>modal.style.opacity='1',10);`
Cierre: `modal.style.opacity='0'; setTimeout(()=>modal.style.display='none',250);`

### Normalización de datos Firestore
```javascript
date:   d.fecha || d.timestamp || d.createdAt || d.date
loc:    d.direccion || d.ubicacion || d.lugar || 'No especificado'
status: d.status || d.estatus || d.fase || 'activo'
```

### Soft delete
- **Eliminar:** `status='papelera'` + `fecha_eliminacion` + `eliminado_por`
- **Restaurar:** `status='activo'`, limpiar metadatos

### Gestión de vistas
- `window.switchTab(id, label)` — muestra vista, actualiza sidebar y breadcrumb
- Sidebar: `<a class="nav-link" id="link-{name}" onclick="window.switchTab('{name}')">`
- Sección "Monitoreo": colapsable via `window.toggleMonitoreoGroup()`
- Sección "Administración": colapsable via `window.toggleAdminGroup()`

### CSS Variables (Fluent UI 9 aplicado a index.html)
| Variable | Valor modo claro |
|---|---|
| `--bg-card` | `#ffffff` |
| `--bg-body` | `#f5f5f5` |
| `--text-main` | `#242424` |
| `--text-muted` | `#616161` |
| `--border` | `#e0e0e0` |
| `--accent` / azul | `#0078d4` |

---

## Adding New Features

**Nueva colección Firestore:** agregar nombre a `ALL_COLLECTIONS` en el `<script type="module">`.

**Nueva vista:**
1. Agregar `<section id="view-{name}" class="view">` en el `<main>`
2. Agregar `<a class="nav-link" id="link-{name}" onclick="window.switchTab('{name}')">` en sidebar
3. Registrar label en el objeto `_tabLabels` dentro de `window.switchTab()`
4. Implementar `window.render{Name}()` y conectarla en `window.executeUIUpdate()`

**Nuevo modal:** seguir el patrón Fluent UI 9 descrito arriba.

---

## Notable Files

| Archivo | Propósito |
|---------|-----------|
| `index.html` | SPA producción — archivo principal activo |
| `modules/usuarios.js` | Módulo gestión de usuarios |
| `Monitoreo_Clima.html` | Módulo clima (standalone con Windy iframe) |
| `Monitoreo_sismos.html` | Módulo sismos (API sismosve + RainViewer + historial) |
| `server.js` | Servidor Express local (proxy sismos) |
| `firebase.json` | Config hosting Firebase |
| `cors.json` | Config CORS Firebase Storage |
| `_archivo/` | Archivos obsoletos — **no se despliegan** |
| `.claude/bump-version.js` | Hook auto-versión al editar `index.html` |

---

## Versioning Hook

El hook en `.claude/settings.json` ejecuta `.claude/bump-version.js` tras cada `Edit`/`Write` en `index.html`:
1. Lee versión actual de `CLAUDE.md`
2. Incrementa el parche
3. Actualiza la fecha
4. Inserta entrada en el Changelog

Agregar manualmente la descripción de cambios en la entrada generada por el hook.
