/**
 * Módulo: Gestión de Usuarios
 * Script IIFE regular — sin ES module imports, compatible con file://.
 * Funcionalidades:
 *   - Nómina en modo lectura por defecto; edición por fila al presionar "Editar"
 *   - Modal "Agregar Usuario" con creación vía Firebase Identity REST API
 */
(function () {
    'use strict';

    /* ── Accesores lazy a Firebase ────────────────────────────────────────── */
    const S        = () => window.__sigrad;
    const db       = () => S().db;
    const col      = n       => S().collection(db(), n);
    const docRef   = (c, id) => S().doc(db(), c, id);
    const notify   = (m, t = 'error') => window.notify?.(m, t);
    const $        = id => document.getElementById(id);

    /* ── Template HTML ────────────────────────────────────────────────────── */
    const template = `
<!-- Stats -->
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px;">
    <div style="background:var(--bg-body);border:1px solid var(--border);border-radius:12px;padding:16px 18px;display:flex;align-items:center;gap:14px;">
        <div style="width:42px;height:42px;background:rgba(0,120,212,0.1);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <i data-lucide="users" style="width:20px;height:20px;color:#0078d4;"></i>
        </div>
        <div><div class="mod-stat-value" id="stat-total" style="font-size:1.9rem;font-weight:800;line-height:1;color:var(--text-main);">--</div><div style="font-size:0.65rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-top:3px;">TOTAL USUARIOS</div></div>
    </div>
    <div style="background:var(--bg-body);border:1px solid var(--border);border-radius:12px;padding:16px 18px;display:flex;align-items:center;gap:14px;">
        <div style="width:42px;height:42px;background:rgba(16,185,129,0.1);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <i data-lucide="user-check" style="width:20px;height:20px;color:#10B981;"></i>
        </div>
        <div><div class="mod-stat-value" id="stat-active" style="font-size:1.9rem;font-weight:800;line-height:1;color:#10B981;">--</div><div style="font-size:0.65rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-top:3px;">ACTIVOS</div></div>
    </div>
    <div style="background:var(--bg-body);border:1px solid var(--border);border-radius:12px;padding:16px 18px;display:flex;align-items:center;gap:14px;">
        <div style="width:42px;height:42px;background:rgba(245,158,11,0.1);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <i data-lucide="clock" style="width:20px;height:20px;color:#F59E0B;"></i>
        </div>
        <div><div class="mod-stat-value" id="stat-pending" style="font-size:1.9rem;font-weight:800;line-height:1;color:#F59E0B;">--</div><div style="font-size:0.65rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-top:3px;">PENDIENTES</div></div>
    </div>
    <div style="background:var(--bg-body);border:1px solid var(--border);border-radius:12px;padding:16px 18px;display:flex;align-items:center;gap:14px;">
        <div style="width:42px;height:42px;background:rgba(139,92,246,0.1);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <i data-lucide="shield-check" style="width:20px;height:20px;color:#8B5CF6;"></i>
        </div>
        <div><div class="mod-stat-value" id="stat-admins" style="font-size:1.9rem;font-weight:800;line-height:1;color:#8B5CF6;">--</div><div style="font-size:0.65rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-top:3px;">ADMINS</div></div>
    </div>
</div>

<!-- Solicitudes pendientes -->
<div style="background:var(--bg-body);border:1px solid var(--border);border-radius:12px;margin-bottom:18px;overflow:hidden;">
    <div style="padding:13px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;">
        <div style="width:28px;height:28px;background:rgba(0,120,212,0.1);border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <i data-lucide="shield-check" style="width:14px;height:14px;color:#0078d4;"></i>
        </div>
        <span style="font-weight:700;font-size:0.8rem;letter-spacing:0.5px;color:var(--text-main);">SOLICITUDES DE ACCESO PENDIENTES</span>
        <span id="badge-pending" style="background:#EF4444;color:white;font-size:0.6rem;padding:1px 7px;border-radius:10px;font-weight:700;margin-left:2px;">0</span>
    </div>
    <table style="width:100%;border-collapse:collapse;">
        <thead>
            <tr style="border-bottom:1px solid var(--border);background:rgba(0,0,0,0.01);">
                <th style="text-align:left;padding:10px 20px;font-size:0.68rem;font-weight:700;color:var(--text-muted);letter-spacing:0.8px;">NOMBRE</th>
                <th style="text-align:left;padding:10px 20px;font-size:0.68rem;font-weight:700;color:var(--text-muted);letter-spacing:0.8px;">EMAIL</th>
                <th style="text-align:left;padding:10px 20px;font-size:0.68rem;font-weight:700;color:var(--text-muted);letter-spacing:0.8px;">MUNICIPIO</th>
                <th style="text-align:left;padding:10px 20px;font-size:0.68rem;font-weight:700;color:var(--text-muted);letter-spacing:0.8px;">FECHA REGISTRO</th>
                <th style="text-align:left;padding:10px 20px;font-size:0.68rem;font-weight:700;color:var(--text-muted);letter-spacing:0.8px;">ACCIONES</th>
            </tr>
        </thead>
        <tbody id="tbody-pending">
            <tr><td colspan="5" style="padding:32px;text-align:center;color:var(--text-muted);">Cargando...</td></tr>
        </tbody>
    </table>
</div>

<!-- Nómina activa -->
<div style="background:var(--bg-body);border:1px solid var(--border);border-radius:12px;overflow:hidden;">

    <!-- Cabecera nómina -->
    <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:10px;">
            <i data-lucide="users" style="width:18px;height:18px;color:#0078d4;"></i>
            <span style="font-weight:700;font-size:0.85rem;color:var(--text-main);">NÓMINA DE OFICIALES</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
            <span style="display:flex;align-items:center;gap:5px;padding:6px 12px;border:1px solid var(--border);border-radius:8px;font-size:0.75rem;color:var(--text-muted);font-weight:600;">
                <i data-lucide="refresh-cw" style="width:12px;height:12px;"></i> TIEMPO REAL
            </span>
            <button id="btn-add-user" onclick="window.usr.openAddModal()"
                style="display:flex;align-items:center;gap:6px;padding:7px 14px;background:#0078d4;color:white;border:none;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;font-family:inherit;">
                <i data-lucide="user-plus" style="width:14px;height:14px;pointer-events:none;"></i>
                Agregar Usuario
            </button>
        </div>
    </div>

    <!-- Filtros -->
    <div style="display:flex;align-items:center;gap:10px;padding:10px 20px;border-bottom:1px solid var(--border);flex-wrap:wrap;">
        <span style="font-size:0.7rem;font-weight:700;color:var(--text-muted);">MUNICIPIO:</span>
        <select id="filter-municipio" onchange="window.usr.applyFilters()"
            style="border:1px solid var(--border);border-radius:7px;padding:5px 10px;font-size:0.8rem;font-family:inherit;background:var(--bg-body);color:var(--text-main);outline:none;cursor:pointer;">
            <option value="TODOS">Todos</option>
            <option value="Lagunillas">Lagunillas</option>
            <option value="Valmore Rodríguez">Valmore Rodríguez</option>
            <option value="Baralt">Baralt</option>
            <option value="Simón Bolívar">Simón Bolívar</option>
            <option value="Cabimas">Cabimas</option>
            <option value="Santa Rita">Santa Rita</option>
            <option value="Miranda">Miranda</option>
            <option value="Sin Asignar">Sin Asignar</option>
        </select>
        <span style="font-size:0.7rem;font-weight:700;color:var(--text-muted);">ROL:</span>
        <select id="filter-rol" onchange="window.usr.applyFilters()"
            style="border:1px solid var(--border);border-radius:7px;padding:5px 10px;font-size:0.8rem;font-family:inherit;background:var(--bg-body);color:var(--text-main);outline:none;cursor:pointer;">
            <option value="TODOS">Todos</option>
            <option value="ADMIN">Admin</option>
            <option value="DIRECTOR">Director</option>
            <option value="COORDINACION">Coordinación</option>
            <option value="OFICIAL">Oficial</option>
            <option value="CONSULTA">Consulta</option>
        </select>
        <div style="flex:1;min-width:200px;position:relative;display:flex;align-items:center;">
            <i data-lucide="search" style="position:absolute;left:9px;width:14px;height:14px;color:var(--text-muted);pointer-events:none;"></i>
            <input type="text" id="search-users" placeholder="Buscar nombre, email..."
                oninput="window.usr.applyFilters()"
                style="width:100%;padding:6px 12px 6px 30px;border:1px solid var(--border);border-radius:7px;font-size:0.85rem;font-family:inherit;background:var(--bg-body);color:var(--text-main);outline:none;box-sizing:border-box;">
        </div>
    </div>

    <!-- Cabecera columnas -->
    <div id="nomina-col-header" style="display:grid;grid-template-columns:1fr 1fr 140px 105px 125px 1fr 70px;align-items:center;padding:9px 20px;font-size:0.67rem;font-weight:700;color:var(--text-muted);letter-spacing:0.8px;border-bottom:1px solid var(--border);background:rgba(0,0,0,0.015);">
        <div onclick="window.usr.sortNomina('nombre')" style="cursor:pointer;user-select:none;display:flex;align-items:center;gap:4px;">NOMBRE <span style="opacity:0.5;">↑↓</span></div>
        <div onclick="window.usr.sortNomina('apellido')" style="cursor:pointer;user-select:none;display:flex;align-items:center;gap:4px;" id="sort-apellido">APELLIDO <span style="opacity:0.5;">↑↓</span></div>
        <div onclick="window.usr.sortNomina('jerarquia')" style="cursor:pointer;user-select:none;display:flex;align-items:center;gap:4px;">JERARQUÍA <span style="opacity:0.5;">↑↓</span></div>
        <div onclick="window.usr.sortNomina('rol')" style="cursor:pointer;user-select:none;display:flex;align-items:center;gap:4px;">ROL <span style="opacity:0.5;">↑↓</span></div>
        <div onclick="window.usr.sortNomina('municipio')" style="cursor:pointer;user-select:none;display:flex;align-items:center;gap:4px;">MUNICIPIO <span style="opacity:0.5;">↑↓</span></div>
        <div onclick="window.usr.sortNomina('email')" style="cursor:pointer;user-select:none;display:flex;align-items:center;gap:4px;">EMAIL <span style="opacity:0.5;">↑↓</span></div>
        <div style="text-align:center;">ACCIONES</div>
    </div>

    <div id="grid-nomina">
        <div style="padding:40px;text-align:center;color:var(--text-muted);">
            <i data-lucide="loader-2" style="width:28px;height:28px;display:block;margin:0 auto 10px;animation:spin 1s linear infinite;"></i>
            Cargando nómina...
        </div>
    </div>
</div>

<!-- Modal: Perfil detallado -->
<div id="modal-perfil" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);z-index:5000;justify-content:center;align-items:center;">
    <div style="width:95%;max-width:660px;max-height:90vh;background:var(--bg-body);border:1px solid rgba(255,255,255,0.1);border-radius:20px;display:flex;flex-direction:column;box-shadow:0 20px 50px rgba(0,0,0,0.5);overflow:hidden;">
        <div style="padding:18px 24px;border-bottom:1px solid rgba(255,255,255,0.05);background:rgba(15,23,42,0.8);display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:0.9rem;font-weight:800;display:flex;align-items:center;gap:8px;">
                <i data-lucide="user-cog" style="width:18px;color:var(--accent);"></i> Perfil del Oficial
            </div>
            <button onclick="window.usr.closePerfil()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:6px;display:flex;align-items:center;">
                <i data-lucide="x" style="width:20px;"></i>
            </button>
        </div>
        <div id="modal-perfil-body" style="flex:1;overflow-y:auto;padding:24px;"></div>
        <div style="padding:14px 24px;border-top:1px solid rgba(255,255,255,0.05);background:rgba(15,23,42,0.5);display:flex;justify-content:flex-end;gap:10px;">
            <button onclick="window.usr.closePerfil()" style="padding:9px 18px;border-radius:8px;border:1px solid var(--border);background:rgba(255,255,255,0.05);color:white;cursor:pointer;font-family:inherit;font-weight:600;">Cancelar</button>
            <button onclick="window.usr.saveDetail()" style="padding:9px 18px;border-radius:8px;border:none;background:var(--accent);color:white;cursor:pointer;font-family:inherit;font-weight:700;">Guardar Cambios</button>
        </div>
    </div>
</div>

<!-- Modal: Agregar Usuario -->
<div id="modal-add-user" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);z-index:5000;justify-content:center;align-items:center;">
    <div style="width:95%;max-width:520px;background:var(--bg-body);border:1px solid var(--border);border-radius:12px;display:flex;flex-direction:column;box-shadow:0 24px 48px rgba(0,0,0,0.25);overflow:hidden;">

        <!-- Header -->
        <div style="padding:20px 24px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:32px;height:32px;background:rgba(0,120,212,0.12);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i data-lucide="user-plus" style="width:17px;height:17px;color:#0078d4;"></i>
                </div>
                <span style="font-size:1rem;font-weight:700;color:var(--text-main);">Agregar Usuario</span>
            </div>
            <button onclick="window.usr.closeAddModal()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:4px;display:flex;align-items:center;border-radius:6px;">
                <i data-lucide="x" style="width:20px;height:20px;"></i>
            </button>
        </div>

        <!-- Body -->
        <div style="padding:24px;overflow-y:auto;max-height:calc(90vh - 130px);">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">

                <div>
                    <label style="display:block;font-size:0.82rem;font-weight:600;color:var(--text-main);margin-bottom:6px;">Nombre</label>
                    <input id="add-nombre" type="text" placeholder="Nombre"
                        style="width:100%;padding:9px 12px;border-radius:8px;background:var(--bg-body);color:var(--text-main);border:1px solid var(--border);font-size:0.9rem;font-family:inherit;outline:none;box-sizing:border-box;">
                </div>

                <div>
                    <label style="display:block;font-size:0.82rem;font-weight:600;color:var(--text-main);margin-bottom:6px;">Apellido</label>
                    <input id="add-apellido" type="text" placeholder="Apellido"
                        style="width:100%;padding:9px 12px;border-radius:8px;background:var(--bg-body);color:var(--text-main);border:1px solid var(--border);font-size:0.9rem;font-family:inherit;outline:none;box-sizing:border-box;">
                </div>

                <div style="grid-column:1/-1;">
                    <label style="display:block;font-size:0.82rem;font-weight:600;color:var(--text-main);margin-bottom:6px;">Email</label>
                    <input id="add-email" type="email" placeholder="correo@ejemplo.com"
                        style="width:100%;padding:9px 12px;border-radius:8px;background:var(--bg-body);color:var(--text-main);border:1px solid var(--border);font-size:0.9rem;font-family:inherit;outline:none;box-sizing:border-box;">
                </div>

                <div>
                    <label style="display:block;font-size:0.82rem;font-weight:600;color:var(--text-main);margin-bottom:6px;">Municipio</label>
                    <select id="add-municipio" style="width:100%;padding:9px 12px;border-radius:8px;background:var(--bg-body);color:var(--text-main);border:1px solid var(--border);font-size:0.9rem;font-family:inherit;outline:none;cursor:pointer;box-sizing:border-box;">
                        <option value="">Sin Asignar</option>
                        <option value="GLOBAL">GLOBAL</option>
                        <option value="Lagunillas">Lagunillas</option>
                        <option value="Valmore Rodríguez">Valmore Rodríguez</option>
                        <option value="Baralt">Baralt</option>
                        <option value="Simón Bolívar">Simón Bolívar</option>
                        <option value="Cabimas">Cabimas</option>
                        <option value="Santa Rita">Santa Rita</option>
                        <option value="Miranda">Miranda</option>
                    </select>
                </div>

                <div>
                    <label style="display:block;font-size:0.82rem;font-weight:600;color:var(--text-main);margin-bottom:6px;">Jerarquía</label>
                    <select id="add-jerarquia" style="width:100%;padding:9px 12px;border-radius:8px;background:var(--bg-body);color:var(--text-main);border:1px solid var(--border);font-size:0.9rem;font-family:inherit;outline:none;cursor:pointer;box-sizing:border-box;">
                        <option value="">Sin Asignar</option>
                        <option value="Agente">Agente</option>
                        <option value="Detective">Detective</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Inspector">Inspector</option>
                        <option value="Sub-Inspector">Sub-Inspector</option>
                        <option value="Comisario">Comisario</option>
                        <option value="Sub-Comisario">Sub-Comisario</option>
                        <option value="Coordinador">Coordinador</option>
                        <option value="Director">Director</option>
                    </select>
                </div>

                <div>
                    <label style="display:block;font-size:0.82rem;font-weight:600;color:var(--text-main);margin-bottom:6px;">Rol</label>
                    <select id="add-rol" style="width:100%;padding:9px 12px;border-radius:8px;background:var(--bg-body);color:var(--text-main);border:1px solid var(--border);font-size:0.9rem;font-family:inherit;outline:none;cursor:pointer;box-sizing:border-box;">
                        <option value="">Seleccione...</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="DIRECTOR">DIRECTOR</option>
                        <option value="COORDINACION">COORDINACIÓN</option>
                        <option value="OFICIAL" selected>OFICIAL</option>
                        <option value="CONSULTA">CONSULTA</option>
                    </select>
                </div>

                <div style="grid-column:1/-1;">
                    <label style="display:block;font-size:0.82rem;font-weight:600;color:var(--text-main);margin-bottom:6px;">Contraseña</label>
                    <input id="add-password" type="password" placeholder="Mínimo 8 caracteres"
                        style="width:100%;padding:9px 12px;border-radius:8px;background:var(--bg-body);color:var(--text-main);border:1px solid var(--border);font-size:0.9rem;font-family:inherit;outline:none;box-sizing:border-box;">
                </div>

            </div>
            <div id="add-error" style="margin-top:14px;padding:10px 14px;border-radius:8px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#EF4444;font-size:0.85rem;display:none;"></div>
        </div>

        <!-- Footer -->
        <div style="padding:16px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px;">
            <button onclick="window.usr.closeAddModal()" style="padding:9px 20px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text-main);cursor:pointer;font-family:inherit;font-weight:600;font-size:0.9rem;">Cancelar</button>
            <button id="btn-add-submit" onclick="window.usr.submitAddUser()"
                style="padding:9px 20px;border-radius:8px;border:none;background:#0078d4;color:white;cursor:pointer;font-family:inherit;font-weight:600;font-size:0.9rem;display:flex;align-items:center;gap:6px;">
                <i data-lucide="user-plus" style="width:15px;height:15px;pointer-events:none;"></i>
                Agregar usuario
            </button>
        </div>
    </div>
</div>`;

    /* ── Lógica del módulo ────────────────────────────────────────────────── */
    function init() {
        var unsubs        = [];
        var allUsers      = [];
        var currentEditId = null;  // fila en modo edición
        var currentDetailId = null; // fila en modal perfil
        var editingRowId  = null;  // solo una fila editable a la vez

        // ── Extraer referencias de Firebase en variables locales ────────────
        // Llamarlas directamente (no como S().fn()) evita problemas de contexto
        var ctx        = S();
        var _db        = ctx.db;
        var _onSnap    = ctx.onSnapshot;
        var _collection = ctx.collection;
        var _query     = ctx.query;
        var _where     = ctx.where;
        var _updateDoc = ctx.updateDoc;
        var _deleteDoc = ctx.deleteDoc;
        var _setDoc    = ctx.setDoc;
        var _addDoc    = ctx.addDoc;
        var _doc       = ctx.doc;
        var _sTs       = ctx.serverTimestamp;
        var _sndPwd    = ctx.sendPasswordResetEmail;
        var _auth      = ctx.auth;
        var _stRef     = ctx.storageRef;
        var _storage   = ctx.storage;
        var _upload    = ctx.uploadBytes;
        var _dlUrl     = ctx.getDownloadURL;
        var _apiKey    = ctx.firebaseApiKey;

        function C(name)      { return _collection(_db, name); }  // CollectionRef
        function D(col, id)   { return _doc(_db, col, id); }      // DocumentRef

        // Constantes de render — deben estar ANTES de startNomina/startPending
        // porque Firebase puede disparar onSnapshot sincrónicamente con caché local
        var ROW_GRID = 'display:grid;grid-template-columns:1fr 1fr 140px 105px 125px 1fr 70px;align-items:center;padding:11px 20px;border-bottom:1px solid var(--border);';
        var BTN      = '';
        var ROLE_STYLES = {
            ADMIN:        'background:#fff7ed;color:#ea580c;border:1px solid #fed7aa',
            DIRECTOR:     'background:#faf5ff;color:#9333ea;border:1px solid #e9d5ff',
            COORDINACION: 'background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe',
            OFICIAL:      'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0',
            CONSULTA:     'background:#f8fafc;color:#64748b;border:1px solid #e2e8f0',
            INVITADO:     'background:#f8fafc;color:#94a3b8;border:1px solid #e2e8f0'
        };
        var ROLE_COLORS = { ADMIN:'#ea580c', DIRECTOR:'#9333ea', COORDINACION:'#2563eb', OFICIAL:'#16a34a', CONSULTA:'#94a3b8', INVITADO:'#94a3b8' };
        var sortField = 'apellido', sortDir = 1;

        var userRole = ctx.userRole;
        var userMun  = (ctx.userProfile || {}).municipio || '';
        var isAdmin  = userRole === 'ADMIN';
        var canEdit  = ['ADMIN','COORDINACION','DIRECTOR'].indexOf(userRole) > -1;

        if (!canEdit) {
            var g = $('grid-nomina');
            if (g) g.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted);">Acceso denegado — se requiere rol ADMIN, DIRECTOR o COORDINACIÓN.</div>';
            var addBtn = $('btn-add-user');
            if (addBtn) addBtn.style.display = 'none';
            return function () {};
        }

        window.usr = {
            applyFilters: applyFilters,
            editRow: editRow,
            cancelRow: cancelRow,
            saveRow: saveRow,
            openDetail: openDetail,
            closePerfil: closePerfil,
            saveDetail: saveDetail,
            handlePhoto: handlePhoto,
            approveUser: approveUser,
            rejectUser: rejectUser,
            deleteUser: deleteUser,
            resetPassword: resetPassword,
            openAddModal: openAddModal,
            closeAddModal: closeAddModal,
            submitAddUser: submitAddUser,
            sortNomina: sortNomina,
        };

        startPending();
        startNomina();
        if (window.lucide) window.lucide.createIcons();

        return function cleanup() {
            unsubs.forEach(function (fn) { fn(); });
            ['modal-perfil', 'modal-add-user'].forEach(function (id) {
                var el = document.getElementById(id);
                if (el && el.parentNode === document.body) document.body.removeChild(el);
            });
            delete window.usr;
        };

        /* ── Solicitudes pendientes ─────────────────────────────────────── */
        function startPending() {
            var q = _query(C('usuarios'), _where('rol', '==', 'pendiente'));
            unsubs.push(_onSnap(q,
                function (snap) {
                    var tbody = $('tbody-pending');
                    var badge = $('badge-pending');
                    var stat  = $('stat-pending');
                    if (!tbody) return;
                    if (badge) badge.textContent = snap.size;
                    if (stat)  stat.textContent  = snap.size;
                    if (snap.empty) {
                        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-muted);">Sin solicitudes pendientes ✓</td></tr>';
                        return;
                    }
                    var rows = '';
                    snap.forEach(function (d) {
                        var u     = d.data();
                        var fecha = u.fechaRegistro && u.fechaRegistro.toDate ? u.fechaRegistro.toDate().toLocaleDateString('es-VE') : 'N/A';
                        rows +=
                            '<tr>' +
                            '<td><strong>' + (u.nombre || '') + ' ' + (u.apellido || '') + '</strong></td>' +
                            '<td style="color:var(--text-muted);font-size:0.8rem;">' + (u.email || '') + '</td>' +
                            '<td>' + (u.municipio || 'Sin Asignar') + '</td>' +
                            '<td style="color:var(--text-muted);">' + fecha + '</td>' +
                            '<td><div style="display:flex;gap:6px;">' +
                            '<button onclick="window.usr.approveUser(\'' + d.id + '\')" style="padding:5px 12px;background:#10B981;color:white;border:none;border-radius:7px;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:inherit;">✓ Aprobar</button>' +
                            '<button onclick="window.usr.rejectUser(\'' + d.id + '\')" style="padding:5px 12px;background:#EF4444;color:white;border:none;border-radius:7px;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:inherit;">✕ Rechazar</button>' +
                            '</div></td></tr>';
                    });
                    tbody.innerHTML = rows;
                },
                function (err) { console.error('[Usuarios][pending]', err); }
            ));
        }

        /* ── Nómina activa ──────────────────────────────────────────────── */
        function startNomina() {
            unsubs.push(_onSnap(C('usuarios'),
                function (snap) {
                    allUsers = snap.docs
                        .map(function (d) { return Object.assign({ id: d.id }, d.data()); })
                        .filter(function (u) { return u.rol !== 'pendiente'; });

                    var eT = $('stat-total'), eA = $('stat-active'), eAd = $('stat-admins');
                    if (eT)  eT.textContent  = allUsers.length;
                    if (eA)  eA.textContent  = allUsers.filter(function (u) { return u.activo !== false; }).length;
                    if (eAd) eAd.textContent = allUsers.filter(function (u) { return ['ADMIN','DIRECTOR','COORDINACION'].indexOf((u.rol || '').toUpperCase()) > -1; }).length;

                    editingRowId = null;
                    renderNomina(allUsers);
                },
                function (err) {
                    console.error('[Usuarios][nomina]', err);
                    var grid = $('grid-nomina');
                    if (grid) grid.innerHTML =
                        '<div style="padding:30px;text-align:center;color:#EF4444;">' +
                        '<b>Error al cargar la nómina:</b><br>' + err.message + '</div>';
                }
            ));
        }

        function applyFilters() {
            var mun    = ($('filter-municipio') || {}).value || 'TODOS';
            var rol    = ($('filter-rol')       || {}).value || 'TODOS';
            var search = (($('search-users')    || {}).value || '').toLowerCase();
            var filtered = allUsers.filter(function (u) {
                var m = u.municipio || 'Sin Asignar';
                var r = (u.rol || '').toUpperCase();
                var t = ((u.nombre || '') + ' ' + (u.apellido || '') + ' ' + (u.email || '')).toLowerCase();
                if (mun !== 'TODOS' && m !== mun)    return false;
                if (rol !== 'TODOS' && r !== rol)    return false;
                if (search && t.indexOf(search) < 0) return false;
                if (userMun && userMun !== 'GLOBAL' && userMun !== 'Sin Asignar' && userMun !== '') {
                    if (m !== userMun) return false;
                }
                return true;
            });
            filtered.sort(function(a, b) {
                var va = ((a[sortField] || '')).toString().toLowerCase();
                var vb = ((b[sortField] || '')).toString().toLowerCase();
                return va < vb ? -sortDir : va > vb ? sortDir : 0;
            });
            renderNomina(filtered);
        }

        /* ── Render nómina (modo lectura por defecto) ──────────────────── */

        function renderNomina(users) {
            var grid = $('grid-nomina');
            if (!grid) return;
            if (!users.length) {
                grid.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted);">Sin resultados</div>';
                return;
            }
            grid.innerHTML = users.map(function (u) {
                return rowReadHTML(u);
            }).join('');
            if (window.lucide) window.lucide.createIcons();
        }

        function rowReadHTML(u) {
            var rol   = (u.rol || 'CONSULTA').toUpperCase();
            var rs    = ROLE_STYLES[rol] || ROLE_STYLES.CONSULTA;
            var jer   = esc(u.jerarquia || u.rango || '');
            var jerHtml = jer ? '<span style="background:var(--bg-hover);border:1px solid var(--border);border-radius:6px;padding:2px 8px;font-size:0.75rem;color:var(--text-main);white-space:nowrap;">' + jer + '</span>' : '<span style="color:var(--text-muted);">—</span>';
            return '<div id="row-' + u.id + '" style="' + ROW_GRID + '">' +
                '<span style="font-weight:600;color:var(--text-main);font-size:0.88rem;">' + esc(u.nombre || '') + '</span>' +
                '<span style="color:var(--text-muted);font-size:0.88rem;">' + esc(u.apellido || '') + '</span>' +
                '<div>' + jerHtml + '</div>' +
                '<div><span style="' + rs + ';padding:3px 9px;border-radius:20px;font-size:0.7rem;font-weight:700;">' + rol + '</span></div>' +
                '<span style="font-size:0.85rem;color:var(--text-main);">' + esc(u.municipio || 'Sin Asignar') + '</span>' +
                '<span style="font-size:0.78rem;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + esc(u.email || '') + '">' + esc(u.email || '') + '</span>' +
                '<div style="display:flex;gap:2px;justify-content:center;">' +
                    '<button onclick="window.usr.editRow(\'' + u.id + '\')" title="Editar" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:5px;border-radius:6px;" onmouseover="this.style.background=\'var(--bg-hover)\';this.style.color=\'#0078d4\'" onmouseout="this.style.background=\'none\';this.style.color=\'var(--text-muted)\'">' +
                        '<i data-lucide="pencil" style="width:15px;height:15px;pointer-events:none;"></i>' +
                    '</button>' +
                    (isAdmin ? '<button onclick="window.usr.deleteUser(\'' + u.id + '\')" title="Eliminar" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:5px;border-radius:6px;" onmouseover="this.style.background=\'rgba(239,68,68,0.08)\';this.style.color=\'#EF4444\'" onmouseout="this.style.background=\'none\';this.style.color=\'var(--text-muted)\'">' +
                        '<i data-lucide="trash-2" style="width:15px;height:15px;pointer-events:none;"></i>' +
                    '</button>' : '') +
                '</div>' +
            '</div>';
        }

        function sortNomina(field) {
            if (sortField === field) sortDir = -sortDir;
            else { sortField = field; sortDir = 1; }
            applyFilters();
        }

        /* ── Modo edición por fila ──────────────────────────────────────── */
        function editRow(id) {
            // Cancelar edición anterior
            if (editingRowId && editingRowId !== id) {
                var prev = allUsers.find(function (u) { return u.id === editingRowId; });
                if (prev) { var r = $('row-' + editingRowId); if (r) r.outerHTML = rowReadHTML(prev); }
            }
            editingRowId = id;
            var u = allUsers.find(function (x) { return x.id === id; });
            if (!u) return;

            var INP  = 'background:var(--bg-body);border:1px solid var(--border);border-radius:6px;color:var(--text-main);font-size:0.83rem;font-family:inherit;padding:5px 8px;width:100%;outline:none;box-sizing:border-box;';
            var SEL  = INP + 'color:var(--accent);font-weight:700;cursor:pointer;';
            var ROLES = ['ADMIN','DIRECTOR','COORDINACION','OFICIAL','CONSULTA','INVITADO'];
            var MUNIS = ['','GLOBAL','Lagunillas','Valmore Rodríguez','Baralt','Simón Bolívar','Cabimas','Santa Rita','Miranda','Sin Asignar'];
            var rol   = (u.rol || 'CONSULTA').toUpperCase();
            var mun   = u.municipio || '';

            var rOpts = ROLES.map(function (r) { return '<option value="' + r + '"' + (rol === r ? ' selected' : '') + '>' + r + '</option>'; }).join('');
            var mOpts = MUNIS.map(function (m) { return '<option value="' + m + '"' + (mun === m ? ' selected' : '') + '>' + (m || 'Sin Asignar') + '</option>'; }).join('');

            var row = $('row-' + id);
            if (!row) return;
            row.style.background = 'rgba(0,120,212,0.04)';
            row.style.borderLeft = '3px solid #0078d4';
            row.innerHTML =
                '<input style="' + INP + '" id="fn-' + id + '" value="' + esc(u.nombre   || '') + '" placeholder="Nombre">' +
                '<input style="' + INP + '" id="ln-' + id + '" value="' + esc(u.apellido || '') + '" placeholder="Apellido">' +
                '<input style="' + INP + '" id="rk-' + id + '" value="' + esc(u.jerarquia || u.rango || '') + '" placeholder="Jerarquía">' +
                '<select style="' + SEL + '" id="rl-' + id + '">' + rOpts + '</select>' +
                '<select style="' + INP + 'cursor:pointer;" id="mn-' + id + '">' + mOpts + '</select>' +
                '<span style="color:var(--text-muted);font-size:0.78rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + esc(u.email || '') + '">' + esc(u.email || '') + '</span>' +
                '<div style="display:flex;gap:5px;justify-content:center;">' +
                    '<button onclick="window.usr.saveRow(\'' + id + '\')" style="' + BTN + 'background:var(--accent);color:white;border-color:var(--accent);">' +
                        '<i data-lucide="save" style="width:13px;pointer-events:none;"></i> Guardar' +
                    '</button>' +
                    '<button onclick="window.usr.cancelRow(\'' + id + '\')" style="' + BTN + 'background:rgba(255,255,255,0.05);color:var(--text-muted);border-color:rgba(255,255,255,0.1);">' +
                        '<i data-lucide="x" style="width:13px;pointer-events:none;"></i>' +
                    '</button>' +
                '</div>';
            if (window.lucide) window.lucide.createIcons();
        }

        function cancelRow(id) {
            editingRowId = null;
            var u = allUsers.find(function (x) { return x.id === id; });
            var row = $('row-' + id);
            if (!u || !row) return;
            row.outerHTML = rowReadHTML(u);
            if (window.lucide) window.lucide.createIcons();
        }

        function saveRow(id) {
            var nombre    = ($('fn-' + id) || {}).value;
            var apellido  = ($('ln-' + id) || {}).value;
            var jerarquia = ($('rk-' + id) || {}).value;
            var rol       = ($('rl-' + id) || {}).value;
            var municipio = ($('mn-' + id) || {}).value;
            if (!nombre || !rol) { notify('Nombre y Rol son obligatorios', 'warning'); return; }

            var btn = $('row-' + id) ? $('row-' + id).querySelector('button') : null;
            _updateDoc(D('usuarios', id), { nombre: nombre, apellido: apellido, jerarquia: jerarquia, rol: rol, municipio: municipio })
                .then(function () {
                    notify('✅ Datos actualizados', 'success');
                    editingRowId = null;
                })
                .catch(function (e) { notify('Error: ' + e.message); });
        }

        /* ── Modal: Perfil detallado ────────────────────────────────────── */
        function openDetail(id) {
            var p = allUsers.find(function (x) { return x.id === id; });
            if (!p) return;
            currentDetailId = id;
            var photoUrl = p.photoUrl || 'https://via.placeholder.com/150?text=SIN+FOTO';
            var INP      = 'width:100%;padding:10px;border-radius:8px;background:var(--bg-card);color:var(--text-main);border:1px solid var(--border);font-size:0.9rem;font-family:inherit;outline:none;';
            var BLOODS   = ['','O+','O-','A+','A-','B+','B-','AB+','AB-'];
            var GUARDS   = ['PRIMERA','SEGUNDA','TERCERA','CUARTA'];
            var COORDS   = ['OPERACIONES','EDUCACIÓN','GESTIÓN DE RIESGO'];
            var fullName = p.apellido ? (p.nombre + ' ' + p.apellido) : (p.nombre || '');

            $('modal-perfil-body').innerHTML =
                '<div style="display:flex;gap:20px;align-items:center;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:20px;">' +
                    '<div style="position:relative;flex-shrink:0;">' +
                        '<img src="' + esc(photoUrl) + '" id="photo-preview" style="width:110px;height:110px;border-radius:12px;object-fit:cover;border:3px solid var(--accent);">' +
                        '<label for="photo-input" style="position:absolute;bottom:-10px;right:-10px;background:var(--accent);color:white;border:none;padding:8px;border-radius:50%;cursor:pointer;box-shadow:0 4px 10px rgba(0,0,0,0.3);display:flex;align-items:center;">📷</label>' +
                        '<input type="file" id="photo-input" style="display:none;" accept="image/*" onchange="window.usr.handlePhoto(event)">' +
                    '</div>' +
                    '<div style="flex:1;">' +
                        '<h2 style="margin:0;font-size:1.3rem;font-weight:800;">' + esc(fullName) + '</h2>' +
                        '<div style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;text-transform:uppercase;">' + esc(p.rango || p.jerarquia || 'Oficial') + '</div>' +
                        '<div style="font-size:0.75rem;color:var(--accent);margin-top:8px;font-weight:800;">UID: ' + esc(p.uid_personal || 'Sin asignar') + '</div>' +
                        '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">' + esc(p.email || '') + '</div>' +
                    '</div>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
                    fld('Cédula',        '<input id="p-cedula"   style="' + INP + '" value="' + esc(p.cedula || '') + '">') +
                    fld('Teléfono',      '<input id="p-phone"    style="' + INP + '" value="' + esc(p.phone  || '') + '">') +
                    fld('Tipo de Sangre','<select id="p-blood"   style="' + INP + 'cursor:pointer;">' + BLOODS.map(function(t){ return '<option value="'+t+'"'+(p.bloodType===t?' selected':'')+'>'+( t||'Seleccione...')+'</option>'; }).join('') + '</select>') +
                    fld('UID Personal',  '<input id="p-uid"      style="' + INP + '" value="' + esc(p.uid_personal || '') + '">') +
                    fld('Guardia',       '<select id="p-guardia" style="' + INP + 'cursor:pointer;">' + GUARDS.map(function(g){ return '<option value="'+g+'"'+(p.guardia===g?' selected':'')+'>'+g+'</option>'; }).join('') + '</select>') +
                    fld('Coordinación',  '<select id="p-coord"   style="' + INP + 'cursor:pointer;">' + COORDS.map(function(c){ return '<option value="'+c+'"'+(p.coordinacion===c?' selected':'')+'>'+c+'</option>'; }).join('') + '</select>') +
                    fld('Hora Entrada',  '<input type="time" id="p-entry" style="' + INP + '" value="' + esc(p.entryTime || '') + '">') +
                    fld('Hora Salida',   '<input type="time" id="p-exit"  style="' + INP + '" value="' + esc(p.exitTime  || '') + '">') +
                '</div>' +
                '<div style="margin-top:14px;">' + fld('Notas', '<textarea id="p-note" rows="2" style="' + INP + 'resize:none;">' + esc(p.note || '') + '</textarea>') + '</div>';

            showModal('modal-perfil');
            if (window.lucide) window.lucide.createIcons();
        }

        function closePerfil() { hideModal('modal-perfil'); }

        function saveDetail() {
            if (!currentDetailId) return;
            _updateDoc(D('usuarios', currentDetailId), {
                cedula:       ($('p-cedula')  || {}).value || '',
                phone:        ($('p-phone')   || {}).value || '',
                bloodType:    ($('p-blood')   || {}).value || '',
                uid_personal: ($('p-uid')     || {}).value || '',
                guardia:      ($('p-guardia') || {}).value || '',
                coordinacion: ($('p-coord')   || {}).value || '',
                entryTime:    ($('p-entry')   || {}).value || '',
                exitTime:     ($('p-exit')    || {}).value || '',
                note:         ($('p-note')    || {}).value || '',
            }).then(function () { notify('✅ Perfil actualizado', 'success'); closePerfil(); })
              .catch(function (e) { notify('Error: ' + e.message); });
        }

        function handlePhoto(event) {
            var file = event.target.files[0];
            if (!file || !currentDetailId) return;
            notify('⏳ Subiendo fotografía...', 'info');
            var r = _stRef(_storage, 'personnel_photos/' + currentDetailId + '_' + Date.now());
            _upload(r, file)
                .then(function () { return _dlUrl(r); })
                .then(function (url) {
                    return _updateDoc(D('usuarios', currentDetailId), { photoUrl: url })
                        .then(function () { var p = $('photo-preview'); if (p) p.src = url; notify('✅ Foto actualizada', 'success'); });
                })
                .catch(function (e) { notify('Error: ' + e.message); });
        }

        /* ── Modal: Agregar Usuario ─────────────────────────────────────── */
        function openAddModal() {
            ['add-nombre','add-apellido','add-email','add-password'].forEach(function (id) {
                var el = $(id); if (el) el.value = '';
            });
            var rol = $('add-rol'); if (rol) rol.value = 'OFICIAL';
            var mun = $('add-municipio'); if (mun) mun.value = '';
            var jer = $('add-jerarquia'); if (jer) jer.value = '';
            var err = $('add-error'); if (err) err.style.display = 'none';
            showModal('modal-add-user');
            if (window.lucide) window.lucide.createIcons();
        }

        function closeAddModal() { hideModal('modal-add-user'); }

        function submitAddUser() {
            var nombre    = ($('add-nombre')    || {}).value || '';
            var apellido  = ($('add-apellido')  || {}).value || '';
            var email     = ($('add-email')     || {}).value || '';
            var pwd       = ($('add-password')  || {}).value || '';
            var jerarquia = ($('add-jerarquia') || {}).value || '';
            var rol       = ($('add-rol')       || {}).value || '';
            var municipio = ($('add-municipio') || {}).value || '';

            var err = $('add-error');
            function showErr(msg) { if (err) { err.textContent = msg; err.style.display = 'block'; } }

            if (!nombre.trim())   { showErr('El nombre es obligatorio.');  return; }
            if (!apellido.trim()) { showErr('El apellido es obligatorio.'); return; }
            if (!email.trim() || email.indexOf('@') < 0) { showErr('Ingrese un correo válido.'); return; }
            if (pwd.length < 8)   { showErr('La contraseña debe tener al menos 8 caracteres.'); return; }
            if (!rol)             { showErr('Seleccione un rol.'); return; }
            if (err) err.style.display = 'none';

            var btn = $('btn-add-submit');
            if (btn) { btn.disabled = true; btn.textContent = '⏳ Creando...'; }

            var apiKey = _apiKey;
            fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + apiKey, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: pwd, returnSecureToken: false })
            })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.error) throw new Error(data.error.message);
                var uid = data.localId;
                return _setDoc(D('usuarios', uid), {
                    nombre: nombre.trim(),
                    apellido: apellido.trim(),
                    email: email.trim().toLowerCase(),
                    jerarquia: jerarquia,
                    rol: rol,
                    municipio: municipio,
                    activo: true,
                    fechaRegistro: _sTs(),
                });
            })
            .then(function () {
                notify('✅ Usuario creado exitosamente', 'success');
                closeAddModal();
            })
            .catch(function (e) {
                var msg = e.message;
                if (msg.indexOf('EMAIL_EXISTS') > -1)  msg = 'El correo ya está registrado.';
                if (msg.indexOf('INVALID_EMAIL') > -1) msg = 'El formato del correo no es válido.';
                if (msg.indexOf('WEAK_PASSWORD') > -1) msg = 'La contraseña es muy débil (mínimo 8 caracteres).';
                showErr(msg);
            })
            .finally(function () {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i data-lucide="user-plus" style="width:15px;height:15px;pointer-events:none;"></i> Agregar usuario';
                    if (window.lucide) window.lucide.createIcons();
                }
            });
        }

        /* ── Acciones: Solicitudes ──────────────────────────────────────── */
        function approveUser(uid) {
            _updateDoc(D('usuarios', uid), { rol: 'CONSULTA', activo: true })
                .then(function () { notify('✅ Usuario aprobado con rol CONSULTA', 'success'); })
                .catch(function (e) { notify('Error: ' + e.message); });
        }

        function rejectUser(uid) {
            if (!confirm('¿Está seguro de rechazar y eliminar esta solicitud?')) return;
            _deleteDoc(D('usuarios', uid))
                .then(function () { notify('Solicitud rechazada', 'warning'); })
                .catch(function (e) { notify('Error: ' + e.message); });
        }

        function deleteUser(uid) {
            if (!confirm('⚠️ Esta acción eliminará permanentemente al usuario.\n\n¿Está seguro?')) return;
            _deleteDoc(D('usuarios', uid))
                .then(function () { notify('Usuario eliminado', 'warning'); })
                .catch(function (e) { notify('Error: ' + e.message); });
        }

        function resetPassword(email) {
            if (!email) { notify('El usuario no tiene correo registrado', 'warning'); return; }
            if (!confirm('Enviar correo de recuperación a:\n' + email + '\n\n¿Continuar?')) return;
            _sndPwd(_auth, email)
                .then(function () { notify('✅ Correo enviado', 'success'); })
                .catch(function (e) { notify('Error: ' + e.message); });
        }

        /* ── Helpers ────────────────────────────────────────────────────── */
        function fld(label, control) {
            return '<div><label style="display:block;font-size:0.65rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px;">' + label + '</label>' + control + '</div>';
        }

        function esc(str) {
            return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        }

        function showModal(id) {
            var m = $(id); if (!m) return;
            // Move to body so position:fixed is always relative to viewport,
            // regardless of any transformed/scrolling ancestor.
            if (m.parentNode !== document.body) document.body.appendChild(m);
            m.style.display = 'flex';
        }

        function hideModal(id) {
            var m = $(id); if (!m) return;
            m.style.display = 'none';
        }
    }

    /* ── Registro ─────────────────────────────────────────────────────────── */
    window.__modules = window.__modules || {};
    window.__modules['usuarios'] = { template: template, init: init };

})();
