#!/usr/bin/env node
/**
 * Hook: auto-incrementa la versión de parche en CLAUDE.md
 * cuando index.html es modificado con las herramientas Edit o Write.
 * Configurado en .claude/settings.json como PostToolUse.
 */
const fs = require('fs');
const path = require('path');

let raw = '';
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
    try {
        const event = JSON.parse(raw);
        const toolName = event.tool_name || '';
        const filePath = event.tool_input?.file_path || '';

        // Solo actuar sobre ediciones a index.html
        if (!['Edit', 'Write'].includes(toolName)) return;
        if (!filePath.endsWith('index.html')) return;

        const claudeMdPath = path.join(process.cwd(), 'CLAUDE.md');
        if (!fs.existsSync(claudeMdPath)) return;

        let content = fs.readFileSync(claudeMdPath, 'utf8');

        // Extraer versión actual
        const versionMatch = content.match(/\*\*Versión actual:\*\*\s+V(\d+)\.(\d+)\.(\d+)/);
        if (!versionMatch) return;

        const [, major, minor, patch] = versionMatch;
        const newPatch = parseInt(patch, 10) + 1;
        const newVersion = `V${major}.${minor}.${newPatch}`;
        const today = new Date().toISOString().slice(0, 10);

        // Actualizar línea de versión y fecha
        content = content
            .replace(
                /\*\*Versión actual:\*\*\s+V\d+\.\d+\.\d+/,
                `**Versión actual:** ${newVersion}`
            )
            .replace(
                /\*\*Última actualización:\*\*\s+[\d-]+/,
                `**Última actualización:** ${today}`
            );

        // Insertar nueva entrada en el Changelog (bajo el encabezado ## Changelog)
        const entry = `\n### ${newVersion} — ${today}\n- index.html modificado\n`;
        content = content.replace(
            /^(## Changelog\n)/m,
            `$1${entry}`
        );

        fs.writeFileSync(claudeMdPath, content, 'utf8');

        // Sincronizar version.json para que el app lo lea en runtime
        const versionJsonPath = path.join(process.cwd(), 'version.json');
        const versionData = { version: newVersion, status: 'Stable', updated: today };
        fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2) + '\n', 'utf8');

        // Actualizar APP_VERSION embebida en index.html (muestra versión sin red)
        // fs.writeFileSync no dispara el hook (solo lo hacen las herramientas Edit/Write de Claude)
        const indexPath = filePath; // ya es la ruta de index.html
        let indexContent = fs.readFileSync(indexPath, 'utf8');
        indexContent = indexContent.replace(
            /const APP_VERSION = 'V\d+\.\d+\.\d+'; const APP_STATUS = 'Stable';/,
            `const APP_VERSION = '${newVersion}'; const APP_STATUS = 'Stable';`
        );
        fs.writeFileSync(indexPath, indexContent, 'utf8');

    } catch (_) {
        // Silencioso — nunca interrumpir el flujo de Claude
    }
});
