#!/usr/bin/env node
/**
 * Webasyst MCP Server (Unified)
 * Полный набор инструментов:
 * - Приложения/Плагины/Виджеты/Темы
 * - Дизайн-система Webasyst UI 2.0
 * - Аналитика структуры, SEO-настройки, dev-ops
 * - Утилиты чтения конфигов/CLI/инфо по приложениям
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { spawn, execSync } from 'child_process';

// ========= Utils =========
const toCamelCase = (s) => s.replace(/[-_](.)/g, (_, c) => c.toUpperCase()).replace(/^./, (m) => m.toUpperCase());
const ensureDir = async (...parts) => fs.mkdir(path.join(...parts), { recursive: true });

async function fileExists(p) {
	try {
		await fs.access(p);
		return true;
	} catch {
		return false;
	}
}

async function findWebasystRoot(startCwd = process.cwd()) {
	let currentDir = startCwd;
	while (currentDir !== '/') {
		const indexPath = path.join(currentDir, 'index.php');
		const systemPath = path.join(currentDir, 'wa-system');
		try {
			await fs.access(indexPath);
			await fs.access(systemPath);
			return currentDir;
		} catch {
			currentDir = path.dirname(currentDir);
		}
	}
	throw new Error('Корневая директория Webasyst не найдена');
}

// Improved PHP config parser
async function readPHPConfigArray(phpFilePath) {
	const content = await fs.readFile(phpFilePath, 'utf-8');
	const match = content.match(/return\s+(array\s*\([\s\S]*?\)|\[[\s\S]*?\]);/);
	if (!match) return {};
	
	const body = match[1];
	const result = {};
	
	// Parse string values: 'key' => 'value'
	const stringPairs = body.matchAll(/'([^']+)'\s*=>\s*'([^']*)'/g);
	for (const m of stringPairs) {
		result[m[1]] = m[2];
	}
	
	// Parse boolean values: 'key' => true/false
	const boolPairs = body.matchAll(/'([^']+)'\s*=>\s*(true|false)/gi);
	for (const m of boolPairs) {
		result[m[1]] = m[2].toLowerCase() === 'true';
	}
	
	// Parse numeric values: 'key' => 123
	const numPairs = body.matchAll(/'([^']+)'\s*=>\s*(\d+)/g);
	for (const m of numPairs) {
		result[m[1]] = parseInt(m[2], 10);
	}
	
	return result;
}

// ========= Info/Read tools =========
async function listWebasystAppsTool({ include_system = false } = {}) {
	const rootPath = await findWebasystRoot();
	const appsPath = path.join(rootPath, 'wa-apps');
	const result = [];
	for (const appDir of await fs.readdir(appsPath)) {
		const configPath = path.join(appsPath, appDir, 'lib', 'config', 'app.php');
		if (!(await fileExists(configPath))) continue;
		const appInfo = await readPHPConfigArray(configPath).catch(() => ({}));
		if (appDir === 'webasyst' && !include_system) continue;
		result.push({ id: appDir, name: appInfo.name || appDir, version: appInfo.version || '0.0.1' });
	}
	return { content: [{ type: 'text', text: `Найдено приложений: ${result.length}\n\n${result.map(a => `- ${a.name} (${a.id}) - v${a.version}`).join('\n')}` }] };
}

async function getAppInfoTool({ app_id }) {
	const rootPath = await findWebasystRoot();
	const appPath = path.join(rootPath, 'wa-apps', app_id);
	const configPath = path.join(appPath, 'lib', 'config', 'app.php');
	if (!(await fileExists(configPath))) throw new Error(`Приложение ${app_id} не найдено`);
	const appInfo = await readPHPConfigArray(configPath).catch(() => ({}));
	return { content: [{ type: 'text', text: JSON.stringify({ id: app_id, ...appInfo, path: appPath }, null, 2) }] };
}

async function listAppPluginsTool({ app_id }) {
	const rootPath = await findWebasystRoot();
	const pluginsPath = path.join(rootPath, 'wa-apps', app_id, 'plugins');
	if (!(await fileExists(pluginsPath))) return { content: [{ type: 'text', text: `У приложения ${app_id} нет плагинов` }] };
	const list = [];
	for (const dir of await fs.readdir(pluginsPath)) {
		const p = path.join(pluginsPath, dir, 'lib', 'config', 'plugin.php');
		if (await fileExists(p)) {
			const info = await readPHPConfigArray(p).catch(() => ({}));
			list.push({ id: dir, name: info.name || dir, version: info.version || '0.0.1' });
		}
	}
	return { content: [{ type: 'text', text: `Плагины приложения ${app_id}:\n\n${list.map(pl => `- ${pl.name} (${pl.id}) - v${pl.version}`).join('\n')}` }] };
}

async function getPluginInfoTool({ app_id, plugin_id }) {
	const rootPath = await findWebasystRoot();
	const pluginPath = path.join(rootPath, 'wa-apps', app_id, 'plugins', plugin_id);
	const configPath = path.join(pluginPath, 'lib', 'config', 'plugin.php');
	if (!(await fileExists(configPath))) throw new Error(`Плагин ${plugin_id} приложения ${app_id} не найден`);
	const pluginInfo = await readPHPConfigArray(configPath).catch(() => ({}));
	return { content: [{ type: 'text', text: JSON.stringify({ id: plugin_id, app_id, ...pluginInfo, path: pluginPath }, null, 2) }] };
}

async function listAppThemesTool({ app_id }) {
	const rootPath = await findWebasystRoot();
	const themesPath = path.join(rootPath, 'wa-apps', app_id, 'themes');
	if (!(await fileExists(themesPath))) return { content: [{ type: 'text', text: `У приложения ${app_id} нет тем` }] };
	const themes = [];
	for (const dir of await fs.readdir(themesPath)) {
		const themeXml = path.join(themesPath, dir, 'theme.xml');
		if (await fileExists(themeXml)) themes.push(dir);
	}
	return { content: [{ type: 'text', text: `Темы приложения ${app_id}:\n\n${themes.map(t => `- ${t}`).join('\n')}` }] };
}

async function listAppWidgetsTool({ app_id }) {
	const rootPath = await findWebasystRoot();
	const widgetsPath = path.join(rootPath, 'wa-apps', app_id, 'widgets');
	if (!(await fileExists(widgetsPath))) return { content: [{ type: 'text', text: `У приложения ${app_id} нет виджетов` }] };
	const widgets = [];
	for (const dir of await fs.readdir(widgetsPath)) {
		const widgetConfig = path.join(widgetsPath, dir, 'lib', 'config', 'widget.php');
		if (await fileExists(widgetConfig)) {
			const info = await readPHPConfigArray(widgetConfig).catch(() => ({}));
			widgets.push({ id: dir, name: info.name || dir });
		}
	}
	return { content: [{ type: 'text', text: `Виджеты приложения ${app_id}:\n\n${widgets.map(w => `- ${w.name} (${w.id})`).join('\n')}` }] };
}

async function getRoutingConfigTool({ app_id } = {}) {
	const rootPath = await findWebasystRoot();
	const routingPath = app_id ? path.join(rootPath, 'wa-apps', app_id, 'lib', 'config', 'routing.php') : path.join(rootPath, 'wa-config', 'routing.php');
	if (!(await fileExists(routingPath))) throw new Error('Конфигурация маршрутизации не найдена');
	const content = await fs.readFile(routingPath, 'utf-8');
	return { content: [{ type: 'text', text: `Конфигурация маршрутизации${app_id ? ` для ${app_id}` : ''}:\n\n${content}` }] };
}

async function getSystemConfigTool() {
	const rootPath = await findWebasystRoot();
	const cfg = path.join(rootPath, 'wa-config', 'SystemConfig.class.php');
	if (!(await fileExists(cfg))) throw new Error('Системная конфигурация не найдена');
	const content = await fs.readFile(cfg, 'utf-8');
	return { content: [{ type: 'text', text: `Системная конфигурация:\n\n${content.substring(0, 2000)}...` }] };
}

async function runWebasystCliTool({ command, args = [] }) {
	const rootPath = await findWebasystRoot();
	const cliPath = path.join(rootPath, 'cli.php');
	if (!(await fileExists(cliPath))) throw new Error('CLI файл не найден');
	return new Promise((resolve, reject) => {
		const child = spawn('php', [cliPath, command, ...args], { cwd: rootPath, stdio: 'pipe' });
		let output = ''; let error = '';
		child.stdout.on('data', d => (output += d.toString()));
		child.stderr.on('data', d => (error += d.toString()));
		child.on('close', (code) => {
			if (code !== 0) reject(new Error(`CLI команда завершилась с кодом ${code}: ${error}`));
			else resolve({ content: [{ type: 'text', text: `Результат выполнения команды "${command}":\n\n${output}` }] });
		});
	});
}

// ========= Creation: app structure (fixed according to official CLI) =========
async function createAppStructureTool({ app_id, app_name, description = '' }) {
	const rootPath = await findWebasystRoot();
	const appPath = path.join(rootPath, 'wa-apps', app_id);
	if (await fileExists(appPath)) throw new Error(`Приложение ${app_id} уже существует`);
	
	// Create directories according to official structure
	const dirs = [
		'lib/config',
		'lib/actions/backend',
		'lib/classes',
		'lib/models',
		'templates/actions/backend',
		'templates/actions/component',
		'css',
		'js',
		'img',
		'locale'
	];
	for (const d of dirs) await ensureDir(appPath, d);
	
	// Create app.php with correct structure (icon as array, ui => 2.0)
	const appPhp = `<?php
return array(
    'name' => /*_w*/('${app_name}'),
    'description' => /*_w*/('${description}'),
    'icon' => array(
        48 => 'img/${app_id}48.png',
        96 => 'img/${app_id}96.png',
    ),
    'version' => '1.0.0',
    'vendor' => 'custom',
    'ui' => '2.0',
);
`;
	await fs.writeFile(path.join(appPath, 'lib', 'config', 'app.php'), appPhp);
	
    // Create Localization infrastructure
    // 1. BackendLoc Action
    const locActionPhp = `<?php
class ${app_id}BackendLocAction extends waViewAction
{
    public function execute()
    {
        $strings = array();

        foreach(array(
            'Welcome to %s',
            'Get started',
            'Sample content',
            'Create',
            'Cancel'
        ) as $s) {
            $strings[$s] = _w($s);
        }

        $this->view->assign('strings', $strings ? $strings : new stdClass());
        $this->getResponse()->addHeader('Content-Type', 'text/javascript; charset=utf-8');
    }
}
`;
    await fs.writeFile(path.join(appPath, 'lib', 'actions', 'backend', `${app_id}BackendLoc.action.php`), locActionPhp);

    // 2. BackendLoc Controller
    const locControllerPhp = `<?php
class ${app_id}BackendLocController extends waViewController
{
    public function execute()
    {
        $this->executeAction(new ${app_id}BackendLocAction());
    }
}
`;
    await fs.writeFile(path.join(appPath, 'lib', 'actions', 'backend', `${app_id}BackendLoc.controller.php`), locControllerPhp);

    // 3. BackendLoc Template
    const locTemplate = `$.wa.locale = $.extend($.wa.locale, {$strings|json_encode});\n`;
    await fs.writeFile(path.join(appPath, 'templates', 'actions', 'backend', 'BackendLoc.html'), locTemplate);

	// Create backend action
	const actionPhp = `<?php

class ${app_id}BackendAction extends waViewAction
{
    public function execute()
    {
        \$this->view->assign('message', sprintf(_w('Welcome to %s'), '${app_name}'));
        \$this->view->assign('description', _w('Sample content'));
    }
}
`;
	await fs.writeFile(path.join(appPath, 'lib', 'actions', 'backend', `${app_id}Backend.action.php`), actionPhp);
	
    // UI wrapper for reuse
    const uiWrapperTpl = `{* Webasyst UI wrapper *}
<link rel="stylesheet" href="{$wa_url}wa-content/css/wa/wa-2.0.css">
{if file_exists($wa_app_path|cat:'/css/wa-ui-variables.css')}
    <link rel="stylesheet" href="{$wa_app_static_url}css/wa-ui-variables.css">
{/if}
`;
    await fs.writeFile(path.join(appPath, 'templates', 'ui_wrapper.html'), uiWrapperTpl);

	// Create template with JS localization и UI 2.0
	const tpl = `<!DOCTYPE html>
<html>
<head>
    <title>{$wa->appName()}</title>
    {$wa->css()}
    {include file="ui_wrapper.html"}
    <link rel="stylesheet" href="{\$wa_app_static_url}css/${app_id}.css">
    <script src="{\$wa_url}wa-apps/ui/js/dialog.js"></script>
    <script src="{\$wa_url}wa-apps/ui/js/dropdown.js"></script>
    <script src="?action=loc"></script>
</head>
<body class="white">
    <div class="block double-padded">
        <header class="flexbox space-between middle">
            <div>
                <h1 class="heading">{$message|escape}</h1>
                <p class="small text-gray">{_w('Get started')}</p>
            </div>
            <div class="wa-buttons">
                <button type="button" class="button blue" id="${app_id}-primary">{_w('Create')}</button>
                <button type="button" class="button light-gray" id="${app_id}-secondary">{_w('Cancel')}</button>
            </div>
        </header>
        <div class="block double-padded">
            <div class="custom-mock">{_w('Sample content')}</div>
        </div>
    </div>
    {$wa->js()}
    <script src="{\$wa_app_static_url}js/${app_id}.js"></script>
</body>
</html>
`;
	await fs.writeFile(path.join(appPath, 'templates', 'actions', 'backend', 'Backend.html'), tpl);
	
	// Create empty CSS and JS files
	await fs.writeFile(path.join(appPath, 'css', `${app_id}.css`), `/* ${app_name} styles */\n.custom-mock {\n    padding: 16px;\n    border: 1px dashed var(--border-color);\n    border-radius: 6px;\n    background: var(--background-color-blank);\n    color: var(--text-color);\n}\n`);
	await fs.writeFile(path.join(appPath, 'js', `${app_id}.js`), `/* ${app_name} scripts */\n(function($) {\n    $(function() {\n        var dialogInstance = null;\n        $('#${app_id}-primary').on('click', function() {\n            dialogInstance = $.wa_ui.dialog.create({\n                title: $_('Create'),\n                content: $_('Sample content')\n            });\n        });\n        $('#${app_id}-secondary').on('click', function() {\n            if (dialogInstance) {\n                dialogInstance.close();\n            }\n        });\n    });\n})(jQuery);\n`);
    await fs.writeFile(path.join(appPath, 'templates', 'actions', 'component', 'ui_wrapper.html'), uiWrapperTpl);
	
	return { content: [{ type: 'text', text: `Структура приложения ${app_name} (${app_id}) создана:\n${appPath}\n\nЛокализация настроена (BackendLoc).` }] };
}

// ========= Creation: plugin structure (fixed) =========
async function createPluginStructureTool({ app_id, plugin_id, plugin_name }) {
	const rootPath = await findWebasystRoot();
	const pluginPath = path.join(rootPath, 'wa-apps', app_id, 'plugins', plugin_id);
	if (await fileExists(pluginPath)) throw new Error(`Плагин ${plugin_id} уже существует`);
	
	const dirs = ['lib/config', 'lib', 'templates', 'css', 'js', 'img', 'locale'];
	for (const d of dirs) await ensureDir(pluginPath, d);
	
	const pluginPhp = `<?php
return array(
    'name' => /*_wp*/('${plugin_name}'),
    'description' => /*_wp*/(''),
    'img' => 'img/${plugin_id}.png',
    'version' => '1.0.0',
    'vendor' => 'custom',
    'handlers' => array(),
);
`;
	await fs.writeFile(path.join(pluginPath, 'lib', 'config', 'plugin.php'), pluginPhp);
	
	const className = `${app_id}${toCamelCase(plugin_id)}Plugin`;
	const classPhp = `<?php

class ${className} extends waPlugin
{
    public function __construct(\$info)
    {
        parent::__construct(\$info);
    }
}
`;
	await fs.writeFile(path.join(pluginPath, 'lib', `${className}.class.php`), classPhp);
	
	return { content: [{ type: 'text', text: `Структура плагина ${plugin_name} (${plugin_id}) создана для ${app_id}:\n${pluginPath}` }] };
}

// ========= Creation: widget for Dashboard =========
async function createWidgetTool({ app_id, widget_id, widget_name, has_settings = false }) {
	const rootPath = await findWebasystRoot();
	let widgetPath;
	
	if (app_id === 'webasyst') {
		widgetPath = path.join(rootPath, 'wa-widgets', widget_id);
	} else {
		widgetPath = path.join(rootPath, 'wa-apps', app_id, 'widgets', widget_id);
	}
	
	if (await fileExists(widgetPath)) throw new Error(`Виджет ${widget_id} уже существует`);
	
	const dirs = ['lib/config', 'lib', 'templates', 'img'];
	for (const d of dirs) await ensureDir(widgetPath, d);
	
	// widget.php config
	const widgetConfig = `<?php
return array(
    'name' => '${widget_name}',
    'size' => array('2x2', '2x1', '1x1'),
    'img' => 'img/${widget_id}.png',
    'version' => '1.0.0',
    'vendor' => 'custom',
);
`;
	await fs.writeFile(path.join(widgetPath, 'lib', 'config', 'widget.php'), widgetConfig);
	
	// settings.php if needed
	if (has_settings) {
		const settingsPhp = `<?php
return array(
    'setting1' => array(
        'title' => 'Setting 1',
        'value' => '',
        'control_type' => waHtmlControl::INPUT,
    ),
);
`;
		await fs.writeFile(path.join(widgetPath, 'lib', 'config', 'settings.php'), settingsPhp);
	}
	
	// Widget class
	const className = app_id === 'webasyst' ? `${widget_id}Widget` : `${app_id}${toCamelCase(widget_id)}Widget`;
	const widgetClass = `<?php

class ${className} extends waWidget
{
    public function defaultAction()
    {
        \$this->display(array(
            'message' => _w('Sample content'),
            'info' => \$this->getInfo()
        ));
    }
}
`;
	await fs.writeFile(path.join(widgetPath, 'lib', `${className}.widget.php`), widgetClass);
	
	// Template
	const template = `<div class="block double-padded">{$message|escape}</div>
`;
	await fs.writeFile(path.join(widgetPath, 'templates', 'Default.html'), template);
	
	return { content: [{ type: 'text', text: `Виджет ${widget_name} (${widget_id}) создан:\n${widgetPath}` }] };
}

// ========= Creation: action/controller =========
async function createActionTool({ app_id, module, action_type = 'action', action_names }) {
	const rootPath = await findWebasystRoot();
	const appPath = path.join(rootPath, 'wa-apps', app_id);
	
	if (!(await fileExists(appPath))) throw new Error(`Приложение ${app_id} не найдено`);
	
	const classTypes = {
		'action': 'waViewAction',
		'actions': 'waViewActions',
		'long': 'waLongActionController',
		'json': 'waJsonController',
		'jsons': 'waJsonActions'
	};
	
	const baseClass = classTypes[action_type] || 'waViewAction';
	const createdFiles = [];
	
	for (const actionName of action_names) {
		const actionsDir = path.join(appPath, 'lib', 'actions', module);
		await ensureDir(actionsDir);
		
		const className = `${app_id}${toCamelCase(module)}${toCamelCase(actionName)}${action_type === 'json' || action_type === 'jsons' ? 'Controller' : 'Action'}`;
		const fileName = action_type === 'actions' || action_type === 'jsons'
			? `${app_id}${toCamelCase(module)}.actions.php`
			: `${app_id}${toCamelCase(module)}${toCamelCase(actionName)}.action.php`;
		
		const filePath = path.join(actionsDir, fileName);
		
		let code;
		if (action_type === 'actions' || action_type === 'jsons') {
			code = `<?php

class ${app_id}${toCamelCase(module)}Actions extends ${baseClass}
{
    public function ${actionName}Action()
    {
        // TODO: implement
    }
}
`;
		} else {
			code = `<?php

class ${className} extends ${baseClass}
{
    public function execute()
    {
        // TODO: implement
    }
}
`;
		}
		
		await fs.writeFile(filePath, code);
		createdFiles.push(filePath);
		
		// Create template for view actions
		if (action_type === 'action' || action_type === 'actions') {
			const templatesDir = path.join(appPath, 'templates', 'actions', module);
			await ensureDir(templatesDir);
			const templateName = `${toCamelCase(module)}${toCamelCase(actionName)}.html`;
			const templatePath = path.join(templatesDir, templateName);
			await fs.writeFile(templatePath, `{* ${actionName} template *}\n`);
			createdFiles.push(templatePath);
		}
	}
	
	return { content: [{ type: 'text', text: `Созданы файлы:\n${createdFiles.join('\n')}` }] };
}

// ========= Creation: model =========
async function createModelTool({ app_id, table_name }) {
	const rootPath = await findWebasystRoot();
	const appPath = path.join(rootPath, 'wa-apps', app_id);
	
	if (!(await fileExists(appPath))) throw new Error(`Приложение ${app_id} не найдено`);
	
	// Determine model directory (some apps use 'model', others 'models')
	let modelsDir = path.join(appPath, 'lib', 'model');
	if (!(await fileExists(modelsDir))) {
		modelsDir = path.join(appPath, 'lib', 'models');
	}
	await ensureDir(modelsDir);
	
    // Generate class name from table name with app prefix
    const camelize = (str) => str.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    const appPrefix = camelize(app_id);
    const tableWithoutApp = table_name.replace(new RegExp(`^${app_id}_`, 'i'), '') || table_name;
    const tableCamel = camelize(tableWithoutApp);
    const className = `${appPrefix}${tableCamel}Model`;
    const fileName = `${app_id}${tableCamel}.model.php`;
	const filePath = path.join(modelsDir, fileName);
	
	const code = `<?php

class ${className} extends waModel
{
    protected \$table = '${table_name}';
}
`;
	
	await fs.writeFile(filePath, code);
	
	return { content: [{ type: 'text', text: `Модель ${className} создана:\n${filePath}` }] };
}

// ========= Creation: theme (universal) =========
async function createThemeTool({ app_id, theme_id, theme_name, prototype = 'default' }) {
	const rootPath = await findWebasystRoot();
	const themesPath = path.join(rootPath, 'wa-apps', app_id, 'themes', theme_id);
	
	if (await fileExists(themesPath)) throw new Error(`Тема ${theme_id} уже существует`);
	
	await ensureDir(themesPath);
	
	// Create theme.xml
	const themeXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE theme PUBLIC "wa-app-theme" "http://www.webasyst.com/wa-content/xml/wa-app-theme.dtd">
<theme id="${theme_id}" system="0" vendor="custom" app="${app_id}" version="1.0.0">
    <name locale="en_US">${theme_name}</name>
    <name locale="ru_RU">${theme_name}</name>
    <description locale="en_US">Custom theme</description>
    <description locale="ru_RU">Пользовательская тема</description>
    <files>
        <file path="index.html">
            <description locale="en_US">Main template</description>
            <description locale="ru_RU">Основной шаблон</description>
        </file>
    </files>
</theme>
`;
	await fs.writeFile(path.join(themesPath, 'theme.xml'), themeXml);
	
	// Create basic index.html
	await fs.writeFile(path.join(themesPath, 'index.html'), `{* ${theme_name} *}\n<!DOCTYPE html>\n<html>\n<head>\n    <title>{\$wa->title()}</title>\n    <link rel="stylesheet" href="{\$wa_url}wa-content/css/wa/wa-2.0.css">\n</head>\n<body>\n    <div class="block double-padded">\n        {$content}\n    </div>\n</body>\n</html>\n`);
	
	// Create cover.png placeholder
	await fs.writeFile(path.join(themesPath, 'cover.png'), '');
	
	return { content: [{ type: 'text', text: `Тема ${theme_name} (${theme_id}) создана для приложения ${app_id}:\n${themesPath}` }] };
}

// ========= Site-specific =========
async function createSitePluginTool(args) {
	const { plugin_type = 'widget', plugin_name, plugin_title, description = '', settings = [], frontend_assets = true, admin_interface = true, webasyst_path } = args;
	const pluginPath = path.join(webasyst_path, 'wa-apps', 'site', 'plugins', plugin_name);
	await ensureDir(pluginPath);
	for (const d of ['lib', 'lib/config', 'templates', 'css', 'js', 'img', 'locale', path.join('locale', 'ru_RU')]) await ensureDir(pluginPath, d);
	
	// Конфигурация плагина в plugin.php
	const pluginConfig = `<?php
return array(
    'name'        => /*_wp*/('${plugin_title}'),
    'description' => /*_wp*/('${description}'),
    'img'         => 'img/${plugin_name}.png',
    'version'     => '1.0.0',
    'vendor'      => 'custom',
    'frontend'    => ${frontend_assets ? 'true' : 'false'},
    'handlers'    => array(
        ${frontend_assets ? "'frontend_footer' => 'frontendFooter'," : ''}
    ),
);
`;
	await fs.writeFile(path.join(pluginPath, 'lib', 'config', 'plugin.php'), pluginConfig);
	
	// Класс плагина
	const classPhp = `<?php

class site${toCamelCase(plugin_name)}Plugin extends sitePlugin
{
    ${frontend_assets ? `/**
     * Хук frontend_footer — вставка контента в footer фронтенда.
     * @param array &\$params
     * @return string
     */
    public function frontendFooter(&\$params)
    {
        return \$this->display();
    }

    /**
     * Отрисовка шаблона плагина.
     * @return string
     */
    protected function display()
    {
        \$view = wa('site')->getView();
        return \$view->fetch(\$this->path.'/templates/frontend_footer.html');
    }` : '// TODO: implement plugin methods'}
}
`;
	await fs.writeFile(path.join(pluginPath, 'lib', `site${toCamelCase(plugin_name)}Plugin.class.php`), classPhp);
	
	// Настройки плагина
	const settingsArray = settings.length ? settings : [];
	const st = `<?php
return array(
    'enabled' => array(
        'title'        => /*_wp*/('Включить'),
        'value'        => 1,
        'control_type' => waHtmlControl::CHECKBOX,
    ),
${settingsArray.map(s => `    '${s.name}' => array(
        'title'        => /*_wp*/('${s.title}'),
        'value'        => '${s.default_value || ''}',
        'control_type' => waHtmlControl::${(s.type || 'INPUT').toUpperCase()},
    ),`).join('\n')}
);
`;
	await fs.writeFile(path.join(pluginPath, 'lib', 'config', 'settings.php'), st);
	
	if (frontend_assets) {
        await fs.writeFile(path.join(pluginPath, 'css', 'frontend.css'), `/* ${plugin_title} */\n.${plugin_name}-container { padding: 16px; border-radius: 8px; background: var(--background-color-blank); }\n`);
		await fs.writeFile(path.join(pluginPath, 'js', 'frontend.js'), `document.addEventListener('DOMContentLoaded', function() { console.log('${plugin_title} ready'); });\n`);
		await fs.writeFile(path.join(pluginPath, 'templates', 'frontend_footer.html'), `{* ${plugin_title} *}\n<div class="${plugin_name}-container">\n    {\$_wp('${plugin_title}')}\n</div>\n`);
	}
	
	// .htaccess для защиты
	await fs.writeFile(path.join(pluginPath, 'lib', '.htaccess'), 'Deny from all\n');
	await fs.writeFile(path.join(pluginPath, 'templates', '.htaccess'), 'Deny from all\n');
	
	return { content: [{ type: 'text', text: `Плагин Site "${plugin_title}" создан: ${pluginPath}` }] };
}

async function createSiteWidgetTool({ widget_name, widget_title, widget_type = 'content', has_settings = true, is_cacheable = false, responsive = true, ajax_support = false, webasyst_path }) {
	const widgetPath = path.join(webasyst_path, 'wa-apps', 'site', 'widgets', widget_name);
	for (const d of ['lib', 'templates', 'css', 'js', 'img', 'locale']) await ensureDir(widgetPath, d);
	const cls = `<?php
class site${toCamelCase(widget_name)}Widget extends siteWidget
{
    public function defaultAction()
    {
        \$this->view->assign('widget_id', \$this->id);
        return \$this->view->fetch(\$this->getTemplate('widget'));
    }

    public function getInfo()
    {
        return array(
            'name' => '${widget_title}',
            'version' => '1.0.0',
            'cache' => ${is_cacheable ? 'true' : 'false'}
        );
    }
}
`;
	await fs.writeFile(path.join(widgetPath, 'lib', `site${toCamelCase(widget_name)}Widget.class.php`), cls);
	await fs.writeFile(path.join(widgetPath, 'templates', 'widget.html'), `<div class="widget-${widget_name}">${widget_title} (${widget_type})</div>\n`);
	return { content: [{ type: 'text', text: `Виджет "${widget_title}" создан: ${widgetPath}` }] };
}

async function createSiteBlockTool({ block_name, block_title, block_category = 'content', webasyst_path }) {
	const blockPath = path.join(webasyst_path, 'wa-apps', 'site', 'blocks', block_name);
	await ensureDir(blockPath);
	await fs.writeFile(path.join(blockPath, 'block.php'), `<?php\nreturn array(\n    'name' => '${block_title}',\n    'category' => '${block_category}'\n);\n`);
	await fs.writeFile(path.join(blockPath, 'block.html'), `{* ${block_title} *}\n<div class="block-${block_name}">\n    <!-- Block content -->\n</div>\n`);
	return { content: [{ type: 'text', text: `Блок "${block_title}" создан: ${blockPath}` }] };
}

async function createSiteThemeTool({ theme_name, theme_title, style_type = 'modern', color_scheme = {}, layout_features = [], responsive_breakpoints = true, dark_mode = false, rtl_support = false, webasyst_path }) {
	const t = path.join(webasyst_path, 'wa-apps', 'site', 'themes', theme_name);
	await ensureDir(t);
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE theme PUBLIC "wa-app-theme" "http://www.webasyst.com/wa-content/xml/wa-app-theme.dtd">
<theme id="${theme_name}" system="0" vendor="custom" app="site" version="1.0.0">
    <name locale="en_US">${theme_title}</name>
    <name locale="ru_RU">${theme_title}</name>
    <description locale="en_US">${theme_title} theme</description>
    <description locale="ru_RU">Тема ${theme_title}</description>
</theme>
`;
	await fs.writeFile(path.join(t, 'theme.xml'), xml);
	await fs.writeFile(path.join(t, 'theme.css'), `:root {\n    --primary: ${color_scheme.primary || 'var(--accent-color)'};\n}\n`);
	await fs.writeFile(path.join(t, 'index.html'), `{* ${theme_title} *}\n<!DOCTYPE html>\n<html>\n<head>\n    <title>{\$wa->title()}</title>\n    <link rel="stylesheet" href="{\$wa_theme_url}theme.css">\n</head>\n<body>\n    <div class="site-theme">${theme_title}</div>\n</body>\n</html>\n`);
	return { content: [{ type: 'text', text: `Тема "${theme_title}" создана: ${t}` }] };
}

// ========= Shop-specific =========
async function createShopPluginTool({ plugin_name, plugin_title, description = '', webasyst_path }) {
	const p = path.join(webasyst_path, 'wa-apps', 'shop', 'plugins', plugin_name);
	for (const d of ['lib', 'lib/config', 'templates', 'css', 'js', 'img', 'locale']) await ensureDir(p, d);
	
	const pluginConfig = `<?php
return array(
    'name' => /*_wp*/('${plugin_title}'),
    'description' => /*_wp*/('${description}'),
    'img' => 'img/${plugin_name}.png',
    'version' => '1.0.0',
    'vendor' => 'custom',
    'handlers' => array(),
);
`;
	await fs.writeFile(path.join(p, 'lib', 'config', 'plugin.php'), pluginConfig);
	
	const cls = `<?php
class shop${toCamelCase(plugin_name)}Plugin extends shopPlugin
{
    // Plugin methods
}
`;
	await fs.writeFile(path.join(p, 'lib', `shop${toCamelCase(plugin_name)}Plugin.class.php`), cls);
	return { content: [{ type: 'text', text: `Shop plugin "${plugin_title}" создан: ${p}` }] };
}

async function createShopThemeTool({ theme_name, theme_title, style_type = 'modern', color_scheme = {}, webasyst_path }) {
	const t = path.join(webasyst_path, 'wa-apps', 'shop', 'themes', theme_name);
	await ensureDir(t);
	await fs.writeFile(path.join(t, 'theme.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<theme id="${theme_name}" app="shop" version="1.0.0">\n    <name locale="en_US">${theme_title}</name>\n    <name locale="ru_RU">${theme_title}</name>\n    <description locale="en_US">${theme_title} theme</description>\n    <description locale="ru_RU">Тема ${theme_title}</description>\n</theme>\n`);
	await fs.writeFile(path.join(t, 'theme.css'), `:root { --primary: ${color_scheme.primary || 'var(--accent-color)'}; }\n`);
	await fs.writeFile(path.join(t, 'index.html'), `{extends file="default.html"}\n{block name="content"}\n<h1>${theme_title}</h1>\n{/block}\n`);
	return { content: [{ type: 'text', text: `Shop theme "${theme_title}" создана: ${t}` }] };
}

async function createShippingPluginTool({ plugin_name, plugin_title, webasyst_path }) {
	// Shipping плагины располагаются в wa-plugins/shipping/
	const p = path.join(webasyst_path, 'wa-plugins', 'shipping', plugin_name);
	for (const d of ['lib', 'lib/config', 'img', 'templates', 'locale']) await ensureDir(p, d);
	
	const pluginConfig = `<?php
return array(
    'name'        => /*_wp*/('${plugin_title}'),
    'description' => /*_wp*/('Плагин доставки'),
    'icon'        => 'img/${plugin_name}16.png',
    'logo'        => 'img/${plugin_name}.png',
    'version'     => '1.0.0',
    'vendor'      => 'custom',
);
`;
	await fs.writeFile(path.join(p, 'lib', 'config', 'plugin.php'), pluginConfig);
	
	// Класс без префикса shop, метод calculate() должен быть protected
	const code = `<?php

/**
 * ${plugin_title} shipping plugin.
 */
class ${plugin_name}Shipping extends waShipping
{
    /**
     * @return array|string|false
     */
    protected function calculate()
    {
        return array(
            'default' => array(
                'name'         => /*_wp*/('${plugin_title}'),
                'description'  => '',
                'est_delivery' => '',
                'currency'     => 'RUB',
                'rate'         => 350.00,
            ),
        );
    }

    /**
     * @return array|string
     */
    public function allowedCurrency()
    {
        return 'RUB';
    }

    /**
     * @return array|string
     */
    public function allowedWeightUnit()
    {
        return 'kg';
    }

    /**
     * @return array
     */
    public function requestedAddressFields()
    {
        return array();
    }
}
`;
	await fs.writeFile(path.join(p, 'lib', `${plugin_name}Shipping.class.php`), code);
	
	// Создаём .htaccess для защиты
	await fs.writeFile(path.join(p, 'lib', '.htaccess'), 'Deny from all\n');
	await fs.writeFile(path.join(p, 'templates', '.htaccess'), 'Deny from all\n');
	
	return { content: [{ type: 'text', text: `Shipping plugin "${plugin_title}" создан в wa-plugins/shipping/${plugin_name}` }] };
}

async function createPaymentPluginTool({ plugin_name, plugin_title, webasyst_path }) {
	// Payment плагины располагаются в wa-plugins/payment/
	const p = path.join(webasyst_path, 'wa-plugins', 'payment', plugin_name);
	for (const d of ['lib', 'lib/config', 'img', 'templates', 'locale']) await ensureDir(p, d);
	
	const pluginConfig = `<?php
return array(
    'name'        => /*_wp*/('${plugin_title}'),
    'description' => /*_wp*/('Плагин оплаты'),
    'icon'        => 'img/${plugin_name}16.png',
    'logo'        => 'img/${plugin_name}.png',
    'version'     => '1.0.0',
    'vendor'      => 'custom',
    'type'        => waPayment::TYPE_ONLINE,
);
`;
	await fs.writeFile(path.join(p, 'lib', 'config', 'plugin.php'), pluginConfig);
	
	// Класс без префикса shop, имплементирует waIPayment
	const code = `<?php

/**
 * ${plugin_title} payment plugin.
 */
class ${plugin_name}Payment extends waPayment implements waIPayment
{
    /**
     * Возвращает список поддерживаемых валют.
     * @return array|string
     */
    public function allowedCurrency()
    {
        return array('RUB', 'USD', 'EUR');
    }

    /**
     * Инициирует платёж.
     * @param array \$payment_form_data
     * @param array \$order_data
     * @param bool \$auto_submit
     * @return string HTML форма для перенаправления на платёжный шлюз
     */
    public function payment(\$payment_form_data, \$order_data, \$auto_submit = false)
    {
        \$order = waOrder::factory(\$order_data);
        
        \$form_fields = array(
            'order_id' => \$order->id,
            'amount'   => number_format(\$order->total, 2, '.', ''),
            'currency' => \$order->currency,
        );
        
        \$view = wa()->getView();
        \$view->assign(array(
            'form_fields' => \$form_fields,
            'form_url'    => 'https://example.com/pay',
            'auto_submit' => \$auto_submit,
        ));
        
        return \$view->fetch(\$this->path.'/templates/payment.html');
    }

    /**
     * Обработка callback от платёжной системы.
     * @param array \$request
     * @return array
     */
    protected function callbackInit(\$request)
    {
        if (!empty(\$request['order_id'])) {
            \$this->order_id = \$request['order_id'];
        }
        return parent::callbackInit(\$request);
    }
}
`;
	await fs.writeFile(path.join(p, 'lib', `${plugin_name}Payment.class.php`), code);
	
	// Создаём шаблон формы оплаты
	const paymentTemplate = `<form method="post" action="{\$form_url}" id="{\$order.id}-payment-form">
    {foreach \$form_fields as \$name => \$value}
    <input type="hidden" name="{\$name}" value="{\$value|escape}">
    {/foreach}
    <input type="submit" value="{\$_w('Pay')}">
</form>
{if \$auto_submit}
<script>
    document.getElementById('{\$order.id}-payment-form').submit();
</script>
{/if}
`;
	await fs.writeFile(path.join(p, 'templates', 'payment.html'), paymentTemplate);
	
	// Создаём .htaccess для защиты
	await fs.writeFile(path.join(p, 'lib', '.htaccess'), 'Deny from all\n');
	await fs.writeFile(path.join(p, 'templates', '.htaccess'), 'Deny from all\n');
	
	return { content: [{ type: 'text', text: `Payment plugin "${plugin_title}" создан в wa-plugins/payment/${plugin_name}` }] };
}

async function createShopReportTool({ report_key, report_title, webasyst_path }) {
	const reportsDir = path.join(webasyst_path, 'wa-apps', 'shop', 'lib', 'reports');
	await ensureDir(reportsDir);
	const file = path.join(reportsDir, `${toCamelCase(report_key)}.report.php`);
	const code = `<?php
class shop${toCamelCase(report_key)}Report extends shopReports
{
    public function getData(\$start, \$end)
    {
        // TODO: implement report logic
        return array(
            'revenue' => 0,
            'orders' => 0
        );
    }
}
`;
	await fs.writeFile(file, code);
	return { content: [{ type: 'text', text: `Report "${report_title}" создан: ${file}` }] };
}

// ========= Generic app (scaffold in external path) =========
async function createGenericAppTool({ name, title, description = '', features = [], webasyst_path }) {
	const app = path.join(webasyst_path, 'wa-apps', name);
	
	const dirs = [
		'lib/config',
		'lib/actions/backend',
		'lib/classes',
		'lib/models',
		'templates/actions/backend',
		'css',
		'js',
		'img',
		'locale'
	];
	for (const d of dirs) await ensureDir(app, d);
	
	await fs.writeFile(path.join(app, 'lib', 'config', 'app.php'), `<?php
return array(
    'name' => '${title}',
    'icon' => array(
        48 => 'img/${name}48.png',
        96 => 'img/${name}96.png',
    ),
    'version' => '1.0.0',
    'vendor' => 'custom',
    'ui' => '2.0',
    'frontend' => true,
    'themes' => true,
);
`);
	await fs.writeFile(path.join(app, 'lib', 'config', 'routing.php'), `<?php\nreturn array(\n    '*' => 'frontend',\n);\n`);
	
	await fs.writeFile(path.join(app, 'lib', 'actions', 'backend', `${name}Backend.action.php`), `<?php
class ${name}BackendAction extends waViewAction
{
    public function execute()
    {
        \$this->view->assign('items', array());
    }
}
`);
	return { content: [{ type: 'text', text: `Приложение "${title}" создано: ${app}` }] };
}

// ========= UI System =========
async function enableWebasystUITool({ project_type, target_path, include_icons = true, include_components = true, include_color_scheme = true }) {
	await ensureDir(target_path, 'css');
	let css = '';
	if (include_color_scheme) {
		css += `:root {
    /* extend UI 2.0 variables here if нужно */
}
`;
	}
	await fs.writeFile(path.join(target_path, 'css', 'wa-ui-variables.css'), css);
	await ensureDir(target_path, 'templates');
	const wrapper = `{* Webasyst UI wrapper *}
<link rel="stylesheet" href="{$wa_url}wa-content/css/wa/wa-2.0.css">
<link rel="stylesheet" href="{$wa_app_static_url}css/wa-ui-variables.css">
`;
	await fs.writeFile(path.join(target_path, 'templates', 'ui_wrapper.html'), wrapper);
	return { content: [{ type: 'text', text: `Webasyst UI 2.0 подключен к ${project_type}` }] };
}

async function createUIComponentTool({ component_type, component_name, target_path, with_js = true }) {
	const cmpDir = path.join(target_path, 'templates', 'components');
	await ensureDir(cmpDir);
	let tpl = '{* Webasyst UI component *}\n';
	let js = '';

	switch (component_type) {
        case 'table':
            tpl += `<table class="zebra">\n    <thead>\n        <tr><th>{_w('ID')}</th><th>{_w('Name')}</th></tr>\n    </thead>\n    <tbody>\n        {foreach $items as $i}\n        <tr><td>{$i.id}</td><td>{$i.name|escape}</td></tr>\n        {/foreach}\n    </tbody>\n</table>\n`;
			break;
		case 'form':
            tpl += `<form method="post" class="wa-form">\n    <div class="field">\n        <div class="name">{_w('Name')}</div>\n        <div class="value">\n            <input type="text" name="name" value="{$name|escape}" class="bold">\n        </div>\n    </div>\n    <div class="field">\n        <div class="name">{_w('Description')}</div>\n        <div class="value">\n            <textarea name="description" class="full-width">{$description|escape}</textarea>\n        </div>\n    </div>\n    <div class="field">\n        <div class="value submit">\n            <button class="button blue" type="submit">{_w('Save')}</button>\n            <button class="button light-gray" type="button" data-role="cancel">{_w('Cancel')}</button>\n        </div>\n    </div>\n</form>\n`;
			break;
        case 'modal':
            tpl += `<div class="dialog" id="${component_name}-dialog">\n    <div class="dialog-background"></div>\n    <div class="dialog-body">\n        <a href="#" class="dialog-close js-close-dialog" aria-label="{_w('Close')}">&times;</a>\n        <header class="dialog-header">\n            <h1>{_w('Modal title')}</h1>\n        </header>\n        <div class="dialog-content">\n            {_w('Content goes here')}\n        </div>\n        <footer class="dialog-footer">\n            <button class="button blue">{_w('Save')}</button>\n            <button class="button light-gray js-close-dialog">{_w('Cancel')}</button>\n        </footer>\n    </div>\n</div>\n`;
			if (with_js) {
				js = `(function($) {
    $(function() {
        var dialog_html = $('#${component_name}-dialog').prop('outerHTML');
        $('#${component_name}-dialog').remove();
        
        window.${component_name.replace(/-/g, '_')}Dialog = {
            open: function() {
                return $.wa_ui.dialog.create({
                    html: dialog_html,
                    onOpen: function($dialog, dialog) {
                        // Инициализация при открытии
                    }
                });
            }
        };
    });
})(jQuery);
`;
			}
			break;
        case 'drawer':
            tpl += `<div class="drawer" id="${component_name}-drawer">\n    <div class="drawer-background"></div>\n    <div class="drawer-body">\n        <a href="#" class="drawer-close js-close-drawer" aria-label="{_w('Close')}">&times;</a>\n        <div class="drawer-block">\n            <header class="drawer-header">\n                <h1>{_w('Drawer title')}</h1>\n            </header>\n            <div class="drawer-content">\n                {_w('Content goes here')}\n            </div>\n            <footer class="drawer-footer">\n                <button class="button blue">{_w('Save')}</button>\n                <button class="button light-gray js-close-drawer">{_w('Close')}</button>\n            </footer>\n        </div>\n    </div>\n</div>\n`;
			if (with_js) {
				js = `(function($) {
    $(function() {
        var drawer_html = $('#${component_name}-drawer').prop('outerHTML');
        $('#${component_name}-drawer').remove();
        
        window.${component_name.replace(/-/g, '_')}Drawer = {
            open: function(options) {
                return $.waDrawer({
                    html: drawer_html,
                    direction: (options && options.direction) || 'right',
                    width: (options && options.width) || '600px',
                    onOpen: function($drawer, drawer) {
                        // Инициализация при открытии
                    }
                });
            }
        };
    });
})(jQuery);
`;
			}
			break;
		case 'chips':
			tpl += `<ul class="chips" id="${component_name}-chips">\n    {foreach $items as $item}\n    <li{if $item.selected} class="selected"{/if}>\n        <a href="{$item.url|escape}">\n            {if $item.icon}<i class="{$item.icon}"></i>{/if}\n            {$item.name|escape}\n            {if $item.count}<span class="count">{$item.count}</span>{/if}\n        </a>\n    </li>\n    {/foreach}\n</ul>\n`;
			break;
		case 'bricks':
			tpl += `<div class="bricks" id="${component_name}-bricks">\n    {foreach $items as $item}\n    <div class="brick{if $item.selected} selected{/if}{if $item.accented} accented{/if}{if $item.full_width} full-width{/if}">\n        {if $item.icon}<span class="icon"><i class="{$item.icon}"></i></span>{/if}\n        {if $item.count}<span class="count">{$item.count}</span>{/if}\n        {$item.name|escape}\n    </div>\n    {/foreach}\n</div>\n`;
			break;
        case 'upload':
            tpl += `<div id="${component_name}-upload" class="box uploadbox">\n    <div class="upload">\n        <label class="link">\n            <span>{_w('Select file')}</span>\n            <input name="files[]" type="file" multiple autocomplete="off">\n        </label>\n    </div>\n    <p class="hint small">{_w('or drag and drop files here')}</p>\n</div>\n`;
			if (with_js) {
				js = `(function($) {
    $(function() {
        $('#${component_name}-upload').waUpload({
            is_uploadbox: true,
            show_file_name: true
        });
    });
})(jQuery);
`;
			}
			break;
        case 'bottombar':
            tpl += `<div class="bottombar" id="${component_name}-bottombar">\n    <ul>\n        {foreach $menu_items as $item}\n        <li{if $item.selected} class="selected"{/if}>\n            <a href="{$item.url|escape}">\n                {if $item.icon}<span class="menu-icon {$item.icon}" aria-hidden="true"></span>{/if}\n                <span>{$item.name|escape}</span>\n                {if $item.badge}<span class="badge">{$item.badge}</span>{/if}\n            </a>\n        </li>\n        {/foreach}\n    </ul>\n</div>\n`;
			break;
		case 'userpic_list':
			tpl += `<div class="flexbox wrap" id="${component_name}-userpics">\n    {foreach $users as $user}\n    <div class="inline-block margin-right">\n        <span class="userpic userpic-48{if $user.outlined} outlined{/if}">\n            {if $user.photo}\n            <img src="{$user.photo}" alt="{$user.name|escape}">\n            {else}\n            <img src="{$wa_url}wa-content/img/userpic.svg" alt="">\n            {/if}\n            {if $user.status}\n            <span class="userstatus{if $user.status_color} bg-{$user.status_color}{/if}">\n                {if $user.status_icon}<i class="{$user.status_icon}"></i>{/if}\n            </span>\n            {/if}\n        </span>\n        <div class="small align-center">{$user.name|escape}</div>\n    </div>\n    {/foreach}\n</div>\n`;
			break;
		case 'slider':
			tpl += `<div class="slider" id="${component_name}-slider">\n    <input type="text" id="${component_name}-min" class="short" value="{$min_value|default:0}">\n    <input type="text" id="${component_name}-max" class="short" value="{$max_value|default:100}">\n</div>\n`;
			if (with_js) {
				js = `(function($) {
    $(function() {
        $("#${component_name}-slider").waSlider({
            \\$input_min: $("#${component_name}-min"),
            \\$input_max: $("#${component_name}-max"),
            limit: { min: 0, max: 100 },
            move: function(values, slider) {
                console.log($_('Move'), values);
            },
            change: function(values, slider) {
                console.log($_('Change'), values);
            }
        });
    });
})(jQuery);
`;
			}
			break;
		case 'toggle':
			tpl += `<div class="toggle" id="${component_name}-toggle">\n    {foreach $options as $option}\n    <span{if $option.selected} class="selected"{/if} data-value="{$option.value|escape}">{$option.name|escape}</span>\n    {/foreach}\n</div>\n`;
			if (with_js) {
				js = `(function($) {
    $(function() {
        $("#${component_name}-toggle").waToggle({
            change: function(event, target, toggle) {
                var value = $(target).data('value');
                console.log($_('Selected'), value);
            }
        });
    });
})(jQuery);
`;
			}
			break;
		case 'skeleton':
			tpl += `<div class="skeleton" id="${component_name}-skeleton">\n    <div class="flexbox">\n        <div class="sidebar blank height-auto">\n            <span class="skeleton-custom-circle size-96" style="margin: 0 auto 1rem;"></span>\n            <span class="skeleton-line"></span>\n            <span class="skeleton-list"></span>\n            <span class="skeleton-list"></span>\n            <span class="skeleton-list"></span>\n        </div>\n        <div class="content">\n            <div class="article">\n                <div class="article-body">\n                    <span class="skeleton-header" style="width: 70%;"></span>\n                    <span class="skeleton-line"></span>\n                    <span class="skeleton-line"></span>\n                    <span class="skeleton-line" style="width: 60%;"></span>\n                </div>\n            </div>\n        </div>\n    </div>\n</div>\n`;
			break;
		case 'tabs':
			tpl += `<ul class="tabs" id="${component_name}-tabs">\n    {foreach $tabs as $tab}\n    <li{if $tab.selected} class="selected"{/if}>\n        <a href="{$tab.url|escape}">{$tab.name|escape}</a>\n    </li>\n    {/foreach}\n</ul>\n<div id="${component_name}-tab-content">\n    {$tab_content}\n</div>\n`;
			if (with_js) {
				js = `(function($) {
    $(function() {
        $('#${component_name}-tabs a').on('click', function(e) {
            e.preventDefault();
            var \\$tab = $(this).closest('li');
            $('#${component_name}-tabs li').removeClass('selected');
            \\$tab.addClass('selected');
            // Load content via AJAX or show/hide
        });
    });
})(jQuery);
`;
			}
			break;
		case 'progressbar':
			tpl += `<div class="progressbar" id="${component_name}-progressbar"></div>\n`;
			if (with_js) {
				js = `(function($) {
    $(function() {
        var \\$bar = $("#${component_name}-progressbar").waProgressbar({
            percentage: 0,
            color: "var(--accent-color)",
            "display-text": true,
            "text-inside": false
        });
        
        window.${component_name.replace(/-/g, '_')}Progressbar = {
            instance: \\$bar.data("progressbar"),
            set: function(percentage, text) {
                this.instance.set({ percentage: percentage, text: text || (percentage + "%") });
            }
        };
    });
})(jQuery);
`;
			}
			break;
        case 'tooltip':
            tpl += `<span class="wa-tooltip" id="${component_name}-tooltip" data-wa-tooltip-content="{$tooltip_text|escape}" data-wa-tooltip-placement="top">?</span>\n`;
			if (with_js) {
				js = `(function($) {
    $(function() {
        $("#${component_name}-tooltip").waTooltip({
            placement: "top",
            trigger: "mouseenter focus"
        });
    });
})(jQuery);
`;
			}
			break;
        case 'autocomplete':
            tpl += `<input type="text" id="${component_name}-autocomplete" class="long" placeholder="{_w('Start typing...')}">\n`;
			if (with_js) {
				js = `(function($) {
    $(function() {
        $("#${component_name}-autocomplete").waAutocomplete({
            source: [], // Array or URL for AJAX
            minLength: 2,
            delay: 300,
            select: function(event, ui) {
                console.log($_('Selected'), ui.item.value);
            }
        });
    });
})(jQuery);
`;
			}
			break;
		case 'menu':
			tpl += `<ul class="menu" id="${component_name}-menu">\n    {foreach $menu_items as $item}\n    <li{if $item.selected} class="selected"{/if}{if $item.accented} class="accented"{/if}>\n        <a href="{$item.url|escape}">\n            {if $item.count}<span class="count">{$item.count}</span>{/if}\n            {if $item.icon}<i class="{$item.icon}"></i>{/if}\n            <span>{$item.name|escape}{if $item.hint} <span class="hint">{$item.hint|escape}</span>{/if}</span>\n        </a>\n        {if $item.children}\n        <ul class="menu">\n            {foreach $item.children as $child}\n            <li{if $child.selected} class="selected"{/if}>\n                <a href="{$child.url|escape}">\n                    {if $child.icon}<i class="{$child.icon}"></i>{/if}\n                    <span>{$child.name|escape}</span>\n                </a>\n            </li>\n            {/foreach}\n        </ul>\n        {/if}\n    </li>\n    {/foreach}\n</ul>\n`;
			break;
        case 'alert':
            tpl += `{if $alert_type && $alert_message}\n<div class="alert {$alert_type}" id="${component_name}-alert">\n    {$alert_message|escape}\n</div>\n{/if}\n`;
			break;
		case 'breadcrumbs':
			tpl += `<ul class="breadcrumbs" id="${component_name}-breadcrumbs">\n    {foreach $breadcrumbs as $crumb}\n    <li{if $crumb.active} class="active"{/if}><a href="{$crumb.url|escape}">{$crumb.name|escape}</a></li>\n    {/foreach}\n</ul>\n`;
			break;
		case 'spinner':
			tpl += `<div class="spinner" id="${component_name}-spinner"></div>\n`;
			break;
        case 'switch':
            tpl += `<div class="switch-with-text" id="${component_name}-switch-wrapper">\n    <span class="switch" id="${component_name}-switch">\n        <input type="checkbox" id="input-${component_name}" checked>\n    </span>\n    <label for="input-${component_name}" data-active-text="{_w('On')}" data-inactive-text="{_w('Off')}">{_w('On')}</label>\n</div>\n`;
			if (with_js) {
				js = `(function($) {
    $(function() {
        $("#${component_name}-switch").waSwitch({
            change: function(active, wa_switch) {
                console.log("Switch active:", active);
            }
        });
    });
})(jQuery);
`;
			}
			break;
        case 'dropdown':
            tpl += `<div class="dropdown" id="${component_name}-dropdown">\n    <button class="dropdown-toggle button outlined" type="button">{_w('Dropdown')}</button>\n    <div class="dropdown-body">\n        <ul class="menu">\n            {foreach $items as $item}\n            <li><a href="{$item.url|escape}">{$item.name|escape}</a></li>\n            {/foreach}\n        </ul>\n    </div>\n</div>\n`;
			if (with_js) {
				js = `(function($) {
    $(function() {
        $("#${component_name}-dropdown").waDropdown();
    });
})(jQuery);
`;
			}
			break;
		case 'card':
			tpl += `<figure class="card" style="width: 300px;">\n    <div class="image">\n        <img src="{$image_url|default:'https://via.placeholder.com/300x200'}" alt="">\n    </div>\n    <div class="details">\n        <h5>{$title|escape}</h5>\n        <p class="small">{$description|escape}</p>\n    </div>\n</figure>\n`;
			break;
		case 'paging':
			tpl += `{if $pages > 1}\n<ul class="paging" id="${component_name}-paging">\n    {if $current_page > 1}\n    <li><a href="{$base_url}page={$current_page - 1}">&larr;</a></li>\n    {/if}\n    {foreach $page_numbers as $p}\n    <li{if $p == $current_page} class="selected"{/if}>\n        {if $p == '...'}<span>...</span>{else}<a href="{$base_url}page={$p}">{$p}</a>{/if}\n    </li>\n    {/foreach}\n    {if $current_page < $pages}\n    <li><a href="{$base_url}page={$current_page + 1}">&rarr;</a></li>\n    {/if}\n</ul>\n{/if}\n`;
			break;
		default:
			tpl += `<!-- Unknown component type: ${component_type} -->\n`;
			break;
	}
	await fs.writeFile(path.join(cmpDir, `${component_name}.html`), tpl);
	
	if (js) {
		const jsDir = path.join(target_path, 'js', 'components');
		await ensureDir(jsDir);
		await fs.writeFile(path.join(jsDir, `${component_name}.js`), js);
	}
	
	return { content: [{ type: 'text', text: `Компонент ${component_type} "${component_name}" создан` + (js ? ` с JS инициализацией` : '') }] };
}

// ========= SEO / Analysis =========
async function setupSeoOptimizationTool({ site_path, features = [], analytics_codes = {}, webasyst_path }) {
	const robots = `User-agent: *\nDisallow:\n`;
	await fs.writeFile(path.join(site_path, 'robots.txt'), robots);
	await fs.writeFile(path.join(site_path, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n`);
	return { content: [{ type: 'text', text: `SEO базовая настройка выполнена в ${site_path}` }] };
}

async function analyzeProjectTool({ project_path, analysis_type = 'structure', generate_report = false }) {
	const summary = { apps: 0, plugins: 0, themes: 0, widgets: 0 };
	const appsPath = path.join(project_path, 'wa-apps');
	if (await fileExists(appsPath)) {
		for (const a of await fs.readdir(appsPath)) {
			const appDir = path.join(appsPath, a);
			if ((await fileExists(path.join(appDir, 'lib', 'config', 'app.php')))) summary.apps++;
			if (await fileExists(path.join(appDir, 'plugins'))) {
				const plugins = await fs.readdir(path.join(appDir, 'plugins'));
				summary.plugins += plugins.length;
			}
			if (await fileExists(path.join(appDir, 'themes'))) {
				const themes = await fs.readdir(path.join(appDir, 'themes'));
				summary.themes += themes.length;
			}
			if (await fileExists(path.join(appDir, 'widgets'))) {
				const widgets = await fs.readdir(path.join(appDir, 'widgets'));
				summary.widgets += widgets.length;
			}
		}
	}
	const text = `Анализ: ${analysis_type}\nПриложений: ${summary.apps}\nПлагинов: ${summary.plugins}\nТем: ${summary.themes}\nВиджетов: ${summary.widgets}`;
	if (generate_report) await fs.writeFile(path.join(project_path, 'mcp-analysis.txt'), text);
	return { content: [{ type: 'text', text }] };
}

// ========= Localization & release helpers =========
async function generatePoTemplateTool({ app_id, locale = 'ru_RU' }) {
	const rootPath = await findWebasystRoot();
	const poDir = path.join(rootPath, 'wa-apps', app_id, 'locale', locale, 'LC_MESSAGES');
	await ensureDir(poDir);
	const poPath = path.join(poDir, `${app_id}.po`);
	if (!(await fileExists(poPath))) {
		const header = `msgid ""\nmsgstr ""\n"Project-Id-Version: ${app_id}\\n"\n"Content-Type: text/plain; charset=UTF-8\\n"\n"Language: ${locale}\\n"\n\n`;
		await fs.writeFile(poPath, header);
	}
	return { content: [{ type: 'text', text: `PO шаблон подготовлен: ${poPath}` }] };
}

async function compileMoTool({ app_id, locale = 'ru_RU' }) {
	const rootPath = await findWebasystRoot();
	const poPath = path.join(rootPath, 'wa-apps', app_id, 'locale', locale, 'LC_MESSAGES', `${app_id}.po`);
	const moPath = path.join(rootPath, 'wa-apps', app_id, 'locale', locale, 'LC_MESSAGES', `${app_id}.mo`);
	if (!(await fileExists(poPath))) throw new Error('PO файл не найден, сначала сгенерируйте шаблон');
	try {
		execSync(`msgfmt "${poPath}" -o "${moPath}"`);
		return { content: [{ type: 'text', text: `MO скомпилирован: ${moPath}` }] };
	} catch (e) {
		throw new Error('Не удалось выполнить msgfmt. Установите gettext.');
	}
}

async function checkProjectComplianceTool({ project_path }) {
	const required = [
		'templates/ui_wrapper.html',
		'lib/actions/backend',
		'locale'
	];
	const missing = [];
	for (const item of required) {
		if (!(await fileExists(path.join(project_path, item)))) missing.push(item);
	}
	const text = missing.length ? `Требует доработки: ${missing.join(', ')}` : 'Базовые требования UI/локализации соблюдены';
	return { content: [{ type: 'text', text }] };
}

async function prepareReleaseBundleTool({ project_path, output = 'webasyst-bundle.zip' }) {
	const outPath = path.isAbsolute(output) ? output : path.join(project_path, output);
	try {
		execSync(`cd "${project_path}" && zip -r "${outPath}" .`, { stdio: 'pipe' });
		return { content: [{ type: 'text', text: `Архив готов: ${outPath}` }] };
	} catch (e) {
		throw new Error('Не удалось собрать архив. Убедитесь, что zip установлен.');
	}
}

// ========= DevOps =========
async function generateNginxVhostTool({ domain, root_path, php_version = '8.2' }) {
	const vhost = `server {
    listen 80;
    server_name ${domain};
    root ${root_path};
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \\.php$ {
        fastcgi_pass unix:/var/run/php/php${php_version}-fpm.sock;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
`;
	const file = path.join(process.cwd(), `${domain}.nginx.conf`);
	await fs.writeFile(file, vhost);
	return { content: [{ type: 'text', text: `Nginx vhost создан: ${file}` }] };
}

async function generateHtaccessTool({ root_path }) {
	const ht = `<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>
`;
	await fs.writeFile(path.join(root_path, '.htaccess'), ht);
	return { content: [{ type: 'text', text: '.htaccess создан' }] };
}

// ========= UI Validation & Generation =========
async function validateUIUsageTool({ project_path, check_colors = true, check_components = true, fix_suggestions = true }) {
	const issues = [];
	const suggestions = [];
	
	// Find CSS files
	const cssFiles = [];
	const cssDir = path.join(project_path, 'css');
	if (await fileExists(cssDir)) {
		for (const file of await fs.readdir(cssDir)) {
			if (file.endsWith('.css') || file.endsWith('.styl')) {
				cssFiles.push(path.join(cssDir, file));
			}
		}
	}
	
	// Check for hardcoded colors
	if (check_colors) {
		const colorPatterns = [
			{ pattern: /#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])/g, name: 'HEX color' },
			{ pattern: /rgb\([^)]+\)/gi, name: 'RGB color' },
			{ pattern: /rgba\([^)]+\)/gi, name: 'RGBA color' }
		];
		
		for (const cssFile of cssFiles) {
			const content = await fs.readFile(cssFile, 'utf-8');
			const lines = content.split('\n');
			
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				// Skip lines with var() - they're using variables correctly
				if (line.includes('var(')) continue;
				// Skip comments
				if (line.trim().startsWith('/*') || line.trim().startsWith('//')) continue;
				
				for (const { pattern, name } of colorPatterns) {
					const matches = line.match(pattern);
					if (matches) {
						for (const match of matches) {
							issues.push({
								file: cssFile,
								line: i + 1,
								type: 'hardcoded_color',
								value: match,
								message: `Hardcoded ${name}: ${match}`
							});
							if (fix_suggestions) {
								suggestions.push(`Line ${i + 1}: Replace "${match}" with CSS variable like var(--text-color), var(--accent-color), etc.`);
							}
						}
					}
				}
			}
		}
	}
	
	// Check for old UI patterns
	if (check_components) {
		const templatesDir = path.join(project_path, 'templates');
		if (await fileExists(templatesDir)) {
			const htmlFiles = [];
			const findHtml = async (dir) => {
				for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
					const fullPath = path.join(dir, entry.name);
					if (entry.isDirectory()) {
						await findHtml(fullPath);
					} else if (entry.name.endsWith('.html')) {
						htmlFiles.push(fullPath);
					}
				}
			};
			await findHtml(templatesDir);
			
			const oldPatterns = [
				{ pattern: /class="[^"]*btn[^"]*"/g, suggestion: 'Use class="button" instead of "btn"' },
				{ pattern: /style="[^"]*color:\s*#/gi, suggestion: 'Move inline color styles to CSS with variables' },
				{ pattern: /style="[^"]*background:\s*#/gi, suggestion: 'Move inline background styles to CSS with variables' }
			];
			
			for (const htmlFile of htmlFiles) {
				const content = await fs.readFile(htmlFile, 'utf-8');
				const lines = content.split('\n');
				
				for (let i = 0; i < lines.length; i++) {
					for (const { pattern, suggestion } of oldPatterns) {
						if (pattern.test(lines[i])) {
							issues.push({
								file: htmlFile,
								line: i + 1,
								type: 'old_pattern',
								message: suggestion
							});
						}
					}
				}
			}
		}
	}
	
	const report = issues.length === 0
		? 'UI validation passed! No issues found.'
		: `Found ${issues.length} issue(s):\n\n${issues.map(i => `${i.file}:${i.line} - ${i.message}`).join('\n')}${suggestions.length > 0 ? '\n\nSuggestions:\n' + suggestions.join('\n') : ''}`;
	
	return { content: [{ type: 'text', text: report }] };
}

async function generateColorSchemeTool({ app_id, scheme_name = 'custom', primary_color, secondary_color, accent_color, text_color, background_color }) {
	const rootPath = await findWebasystRoot();
	const appPath = path.join(rootPath, 'wa-apps', app_id);
	
	if (!(await fileExists(appPath))) throw new Error(`Приложение ${app_id} не найдено`);
	
	const cssDir = path.join(appPath, 'css');
	await ensureDir(cssDir);
	
	const cssContent = `/**
 * ${scheme_name} Color Scheme for ${app_id}
 * Generated by Webasyst MCP
 */

:root {
    /* Primary colors */
    --${app_id}-primary: ${primary_color || 'var(--accent-color)'};
    --${app_id}-secondary: ${secondary_color || 'var(--blue)'};
    --${app_id}-accent: ${accent_color || 'var(--accent-color)'};
    
    /* Text colors */
    --${app_id}-text: ${text_color || 'var(--text-color)'};
    --${app_id}-text-light: var(--text-color-hint);
    --${app_id}-text-strong: var(--text-color-strong);
    
    /* Background colors */
    --${app_id}-bg: ${background_color || 'var(--background-color)'};
    --${app_id}-bg-blank: var(--background-color-blank);
    --${app_id}-bg-input: var(--background-color-input);
    
    /* Borders */
    --${app_id}-border: var(--border-color);
    --${app_id}-border-input: var(--border-color-input);
    
    /* Shadows */
    --${app_id}-shadow: var(--box-shadow);
    --${app_id}-shadow-large: var(--box-shadow-large);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    :root {
        /* Override colors for dark mode if needed */
    }
}
`;
	
	const filePath = path.join(cssDir, `${scheme_name}-theme.css`);
	await fs.writeFile(filePath, cssContent);
	
	return { content: [{ type: 'text', text: `Цветовая схема "${scheme_name}" создана: ${filePath}\n\nПодключите в шаблоне:\n<link rel="stylesheet" href="{$wa_app_static_url}css/${scheme_name}-theme.css">` }] };
}

async function createResponsiveLayoutTool({ app_id, with_sidebar = true, with_bottombar = true }) {
	const rootPath = await findWebasystRoot();
	const appPath = path.join(rootPath, 'wa-apps', app_id);
	
	if (!(await fileExists(appPath))) throw new Error(`Приложение ${app_id} не найдено`);
	
	const layoutsDir = path.join(appPath, 'lib', 'layouts');
	const templatesDir = path.join(appPath, 'templates', 'layouts');
	await ensureDir(layoutsDir);
	await ensureDir(templatesDir);
	
	const className = app_id.charAt(0).toUpperCase() + app_id.slice(1);
	
	// Desktop Layout PHP
	const desktopLayoutPhp = `<?php

class ${className}DesktopLayout extends waLayout
{
    public function execute()
    {
        // Assign common variables
        \$this->executeAction('sidebar', new ${app_id}BackendSidebarAction());
    }
}
`;
	
	// Mobile Layout PHP
	const mobileLayoutPhp = `<?php

class ${className}MobileLayout extends waLayout
{
    public function execute()
    {
        // Assign common variables for mobile
        \$this->view->assign('is_mobile', true);
    }
}
`;
	
	// Backend Controller with isMobile() check
	const controllerPhp = `<?php

class ${app_id}BackendController extends waViewController
{
    public function execute()
    {
        if (\$this->getRequest()->isMobile()) {
            \$this->setLayout(new ${className}MobileLayout());
        } else {
            \$this->setLayout(new ${className}DesktopLayout());
        }
    }
}
`;
	
	// Desktop Layout HTML
	const desktopHtml = `<!DOCTYPE html>
<html>
<head>
    <title>{\$wa->appName()}</title>
    {\$wa->css()}
    {include file="ui_wrapper.html"}
    <link rel="stylesheet" href="{\$wa_app_static_url}css/${app_id}.css">
</head>
<body class="white">
    <div id="wa-app" class="flexbox">
        ${with_sidebar ? `<div class="sidebar width-adaptive mobile-friendly">
            <div class="sidebar-body">
                {\$sidebar}
            </div>
        </div>` : ''}
        <div class="content">
            <div class="block double-padded">
                {\$content}
            </div>
        </div>
    </div>
    {\$wa->js()}
    <script src="{\$wa_app_static_url}js/${app_id}.js"></script>
</body>
</html>
`;
	
	// Mobile Layout HTML
	const mobileHtml = `<!DOCTYPE html>
<html>
<head>
    <title>{\$wa->appName()}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    {\$wa->css()}
    {include file="ui_wrapper.html"}
    <link rel="stylesheet" href="{\$wa_app_static_url}css/${app_id}.css">
</head>
<body class="white mobile">
    <div id="wa-app"${with_bottombar ? ' class="with-bottombar"' : ''}>
        <div class="content">
            <div class="block padded">
                {\$content}
            </div>
        </div>
        ${with_bottombar ? `<div class="bottombar">
            <ul>
                <li class="selected">
                    <a href="#">
                        <span>{\$_('Home')}</span>
                    </a>
                </li>
                <li>
                    <a href="#">
                        <span>{\$_('List')}</span>
                    </a>
                </li>
                <li>
                    <a href="#">
                        <span>{\$_('Settings')}</span>
                    </a>
                </li>
            </ul>
        </div>` : ''}
    </div>
    {\$wa->js()}
    <script src="{\$wa_app_static_url}js/${app_id}.js"></script>
</body>
</html>
`;
	
	// Write files
	await fs.writeFile(path.join(layoutsDir, `${className}DesktopLayout.class.php`), desktopLayoutPhp);
	await fs.writeFile(path.join(layoutsDir, `${className}MobileLayout.class.php`), mobileLayoutPhp);
	await fs.writeFile(path.join(templatesDir, 'Desktop.html'), desktopHtml);
	await fs.writeFile(path.join(templatesDir, 'Mobile.html'), mobileHtml);
	
	const createdFiles = [
		`lib/layouts/${className}DesktopLayout.class.php`,
		`lib/layouts/${className}MobileLayout.class.php`,
		`templates/layouts/Desktop.html`,
		`templates/layouts/Mobile.html`
	];
	
	return { content: [{ type: 'text', text: `Адаптивные лейауты созданы для ${app_id}:\n\n${createdFiles.join('\n')}\n\nИспользуйте в контроллере:\n\nif ($this->getRequest()->isMobile()) {\n    $this->setLayout(new ${className}MobileLayout());\n} else {\n    $this->setLayout(new ${className}DesktopLayout());\n}` }] };
}

// ========= MCP Server =========
class WebasystMCPServer {
	constructor() {
		this.server = new Server({ name: 'webasyst-mcp', version: '2.2.0' }, { capabilities: { tools: {} } });
		this.setupHandlers();
	}

	setupHandlers() {
		this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
			tools: [
				// Info
				{ name: 'list_webasyst_apps', description: 'Получить список всех приложений Webasyst', inputSchema: { type: 'object', properties: { include_system: { type: 'boolean', default: false, description: 'Включить системные приложения' } } } },
				{ name: 'get_app_info', description: 'Получить информацию о конкретном приложении', inputSchema: { type: 'object', properties: { app_id: { type: 'string', description: 'ID приложения' } }, required: ['app_id'] } },
				{ name: 'list_app_plugins', description: 'Получить список плагинов приложения', inputSchema: { type: 'object', properties: { app_id: { type: 'string', description: 'ID приложения' } }, required: ['app_id'] } },
				{ name: 'get_plugin_info', description: 'Получить информацию о плагине', inputSchema: { type: 'object', properties: { app_id: { type: 'string', description: 'ID приложения' }, plugin_id: { type: 'string', description: 'ID плагина' } }, required: ['app_id', 'plugin_id'] } },
				{ name: 'list_app_themes', description: 'Получить список тем оформления приложения', inputSchema: { type: 'object', properties: { app_id: { type: 'string', description: 'ID приложения' } }, required: ['app_id'] } },
				{ name: 'list_app_widgets', description: 'Получить список виджетов приложения', inputSchema: { type: 'object', properties: { app_id: { type: 'string', description: 'ID приложения' } }, required: ['app_id'] } },
				{ name: 'get_routing_config', description: 'Получить конфигурацию маршрутизации', inputSchema: { type: 'object', properties: { app_id: { type: 'string', description: 'ID приложения (опционально)' } } } },
				{ name: 'get_system_config', description: 'Получить системную конфигурацию', inputSchema: { type: 'object', properties: {} } },
				{ name: 'run_webasyst_cli', description: 'Выполнить CLI команду Webasyst', inputSchema: { type: 'object', properties: { command: { type: 'string', description: 'CLI команда для выполнения' }, args: { type: 'array', items: { type: 'string' }, description: 'Аргументы команды', default: [] } }, required: ['command'] } },

				// Creation - basic
				{ name: 'create_app_structure', description: 'Создать структуру нового приложения', inputSchema: { type: 'object', properties: { app_id: { type: 'string', description: 'ID нового приложения' }, app_name: { type: 'string', description: 'Название приложения' }, description: { type: 'string', description: 'Описание приложения' } }, required: ['app_id', 'app_name'] } },
				{ name: 'create_plugin_structure', description: 'Создать структуру нового плагина', inputSchema: { type: 'object', properties: { app_id: { type: 'string', description: 'ID приложения' }, plugin_id: { type: 'string', description: 'ID плагина' }, plugin_name: { type: 'string', description: 'Название плагина' } }, required: ['app_id', 'plugin_id', 'plugin_name'] } },
				{ name: 'create_widget', description: 'Создать виджет для Dashboard', inputSchema: { type: 'object', properties: { app_id: { type: 'string', description: 'ID приложения (webasyst для системного виджета)' }, widget_id: { type: 'string', description: 'ID виджета' }, widget_name: { type: 'string', description: 'Название виджета' }, has_settings: { type: 'boolean', default: false, description: 'Имеет настройки' } }, required: ['app_id', 'widget_id', 'widget_name'] } },
				{ name: 'create_action', description: 'Создать action или controller', inputSchema: { type: 'object', properties: { app_id: { type: 'string', description: 'ID приложения' }, module: { type: 'string', description: 'Название модуля (backend, frontend и т.д.)' }, action_type: { type: 'string', enum: ['action', 'actions', 'long', 'json', 'jsons'], default: 'action', description: 'Тип action' }, action_names: { type: 'array', items: { type: 'string' }, description: 'Названия actions' } }, required: ['app_id', 'module', 'action_names'] } },
				{ name: 'create_model', description: 'Создать модель для работы с БД', inputSchema: { type: 'object', properties: { app_id: { type: 'string', description: 'ID приложения' }, table_name: { type: 'string', description: 'Название таблицы в БД' } }, required: ['app_id', 'table_name'] } },
				{ name: 'create_theme', description: 'Создать тему оформления для приложения', inputSchema: { type: 'object', properties: { app_id: { type: 'string', description: 'ID приложения' }, theme_id: { type: 'string', description: 'ID темы' }, theme_name: { type: 'string', description: 'Название темы' }, prototype: { type: 'string', default: 'default', description: 'Прототип темы' } }, required: ['app_id', 'theme_id', 'theme_name'] } },

				// Site
				{ name: 'create_site_plugin', description: 'Создать плагин для приложения Site', inputSchema: { type: 'object', properties: { plugin_type: { type: 'string' }, plugin_name: { type: 'string' }, plugin_title: { type: 'string' }, description: { type: 'string' }, settings: { type: 'array', items: { type: 'object' } }, frontend_assets: { type: 'boolean' }, admin_interface: { type: 'boolean' }, webasyst_path: { type: 'string' } }, required: ['plugin_name', 'plugin_title', 'webasyst_path'] } },
				{ name: 'create_site_widget', description: 'Создать виджет для Site', inputSchema: { type: 'object', properties: { widget_name: { type: 'string' }, widget_title: { type: 'string' }, widget_type: { type: 'string' }, has_settings: { type: 'boolean' }, is_cacheable: { type: 'boolean' }, responsive: { type: 'boolean' }, ajax_support: { type: 'boolean' }, webasyst_path: { type: 'string' } }, required: ['widget_name', 'widget_title', 'webasyst_path'] } },
				{ name: 'create_site_block', description: 'Создать блок конструктора Site', inputSchema: { type: 'object', properties: { block_name: { type: 'string' }, block_title: { type: 'string' }, block_category: { type: 'string' }, webasyst_path: { type: 'string' } }, required: ['block_name', 'block_title', 'webasyst_path'] } },
				{ name: 'create_site_theme', description: 'Создать тему для Site', inputSchema: { type: 'object', properties: { theme_name: { type: 'string' }, theme_title: { type: 'string' }, style_type: { type: 'string' }, color_scheme: { type: 'object' }, layout_features: { type: 'array', items: { type: 'string' } }, responsive_breakpoints: { type: 'boolean' }, dark_mode: { type: 'boolean' }, rtl_support: { type: 'boolean' }, webasyst_path: { type: 'string' } }, required: ['theme_name', 'theme_title', 'webasyst_path'] } },

				// Shop
				{ name: 'create_shop_plugin', description: 'Создать плагин Shop-Script', inputSchema: { type: 'object', properties: { plugin_name: { type: 'string' }, plugin_title: { type: 'string' }, description: { type: 'string' }, webasyst_path: { type: 'string' } }, required: ['plugin_name', 'plugin_title', 'webasyst_path'] } },
				{ name: 'create_shop_theme', description: 'Создать тему Shop-Script', inputSchema: { type: 'object', properties: { theme_name: { type: 'string' }, theme_title: { type: 'string' }, style_type: { type: 'string' }, color_scheme: { type: 'object' }, webasyst_path: { type: 'string' } }, required: ['theme_name', 'theme_title', 'webasyst_path'] } },
				{ name: 'create_shipping_plugin', description: 'Создать плагин доставки (wa-plugins/shipping/)', inputSchema: { type: 'object', properties: { plugin_name: { type: 'string', description: 'ID плагина (латиница)' }, plugin_title: { type: 'string', description: 'Название плагина' }, webasyst_path: { type: 'string', description: 'Путь к Webasyst' } }, required: ['plugin_name', 'plugin_title', 'webasyst_path'] } },
				{ name: 'create_payment_plugin', description: 'Создать плагин оплаты (wa-plugins/payment/)', inputSchema: { type: 'object', properties: { plugin_name: { type: 'string', description: 'ID плагина (латиница)' }, plugin_title: { type: 'string', description: 'Название плагина' }, webasyst_path: { type: 'string', description: 'Путь к Webasyst' } }, required: ['plugin_name', 'plugin_title', 'webasyst_path'] } },
				{ name: 'create_shop_report', description: 'Создать отчет Shop-Script', inputSchema: { type: 'object', properties: { report_key: { type: 'string' }, report_title: { type: 'string' }, webasyst_path: { type: 'string' } }, required: ['report_key', 'report_title', 'webasyst_path'] } },

				// Generic app in external path
				{ name: 'create_generic_app', description: 'Создать новое приложение Webasyst (в указанном пути)', inputSchema: { type: 'object', properties: { name: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' }, features: { type: 'array', items: { type: 'string' } }, webasyst_path: { type: 'string' } }, required: ['name', 'title', 'webasyst_path'] } },

				// UI
				{ name: 'enable_webasyst_ui', description: 'Подключить дизайн-систему Webasyst UI 2.0', inputSchema: { type: 'object', properties: { project_type: { type: 'string' }, target_path: { type: 'string' }, include_icons: { type: 'boolean' }, include_components: { type: 'boolean' }, include_color_scheme: { type: 'boolean' } }, required: ['project_type', 'target_path'] } },
				{ name: 'create_ui_component', description: 'Сгенерировать UI-компонент Webasyst 2.0', inputSchema: { type: 'object', properties: { component_type: { type: 'string', enum: ['table', 'form', 'modal', 'drawer', 'chips', 'bricks', 'upload', 'bottombar', 'userpic_list', 'slider', 'toggle', 'switch', 'skeleton', 'tabs', 'progressbar', 'tooltip', 'autocomplete', 'menu', 'alert', 'paging', 'breadcrumbs', 'spinner', 'dropdown', 'card'], description: 'Тип компонента: table, form, modal, drawer, chips, bricks, upload, bottombar, userpic_list, slider, toggle, switch, skeleton, tabs, progressbar, tooltip, autocomplete, menu, alert, paging, breadcrumbs, spinner, dropdown, card' }, component_name: { type: 'string', description: 'Уникальное имя компонента (латиница, без пробелов)' }, target_path: { type: 'string', description: 'Путь к приложению/плагину' }, with_js: { type: 'boolean', default: true, description: 'Создать JS-инициализацию (для modal, drawer, upload, slider, toggle, tabs, progressbar, tooltip, autocomplete, switch, dropdown)' } }, required: ['component_type', 'component_name', 'target_path'] } },

				// SEO/Analysis
				{ name: 'setup_seo_optimization', description: 'Базовые SEO-настройки (robots/sitemap)', inputSchema: { type: 'object', properties: { site_path: { type: 'string' }, features: { type: 'array', items: { type: 'string' } }, analytics_codes: { type: 'object' }, webasyst_path: { type: 'string' } }, required: ['site_path'] } },
				{ name: 'analyze_project', description: 'Проанализировать проект Webasyst', inputSchema: { type: 'object', properties: { project_path: { type: 'string' }, analysis_type: { type: 'string' }, generate_report: { type: 'boolean' } }, required: ['project_path'] } },
                { name: 'generate_po_template', description: 'Создать/обновить PO шаблон для приложения', inputSchema: { type: 'object', properties: { app_id: { type: 'string' }, locale: { type: 'string' } }, required: ['app_id'] } },
                { name: 'compile_mo', description: 'Скомпилировать .mo из .po', inputSchema: { type: 'object', properties: { app_id: { type: 'string' }, locale: { type: 'string' } }, required: ['app_id'] } },
                { name: 'check_project_compliance', description: 'Проверить базовое соответствие UI/локализации', inputSchema: { type: 'object', properties: { project_path: { type: 'string' } }, required: ['project_path'] } },
                { name: 'prepare_release_bundle', description: 'Собрать архив проекта для публикации', inputSchema: { type: 'object', properties: { project_path: { type: 'string' }, output: { type: 'string' } }, required: ['project_path'] } },

				// DevOps
				{ name: 'generate_nginx_vhost', description: 'Сгенерировать nginx-конфиг', inputSchema: { type: 'object', properties: { domain: { type: 'string' }, root_path: { type: 'string' }, php_version: { type: 'string' } }, required: ['domain', 'root_path'] } },
				{ name: 'generate_htaccess', description: 'Сгенерировать .htaccess', inputSchema: { type: 'object', properties: { root_path: { type: 'string' } }, required: ['root_path'] } },

				// UI Validation & Generation
				{ name: 'validate_ui_usage', description: 'Проверить использование UI 2.0 (хардкод цветов, устаревшие паттерны)', inputSchema: { type: 'object', properties: { project_path: { type: 'string', description: 'Путь к приложению/плагину' }, check_colors: { type: 'boolean', default: true, description: 'Проверять хардкод цвета' }, check_components: { type: 'boolean', default: true, description: 'Проверять устаревшие паттерны' }, fix_suggestions: { type: 'boolean', default: true, description: 'Показывать предложения по исправлению' } }, required: ['project_path'] } },
				{ name: 'generate_color_scheme', description: 'Сгенерировать CSS-переменные цветовой схемы', inputSchema: { type: 'object', properties: { app_id: { type: 'string', description: 'ID приложения' }, scheme_name: { type: 'string', default: 'custom', description: 'Название схемы' }, primary_color: { type: 'string', description: 'Основной цвет (или CSS-переменная)' }, secondary_color: { type: 'string', description: 'Вторичный цвет' }, accent_color: { type: 'string', description: 'Акцентный цвет' }, text_color: { type: 'string', description: 'Цвет текста' }, background_color: { type: 'string', description: 'Цвет фона' } }, required: ['app_id'] } },
				{ name: 'create_responsive_layout', description: 'Создать адаптивные лейауты (Desktop + Mobile) с isMobile()', inputSchema: { type: 'object', properties: { app_id: { type: 'string', description: 'ID приложения' }, with_sidebar: { type: 'boolean', default: true, description: 'Включить сайдбар в Desktop' }, with_bottombar: { type: 'boolean', default: true, description: 'Включить bottombar в Mobile' } }, required: ['app_id'] } },
			]
		}));

		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			const { name, arguments: args } = request.params;
			try {
				switch (name) {
					// Info
					case 'list_webasyst_apps': return await listWebasystAppsTool(args);
					case 'get_app_info': return await getAppInfoTool(args);
					case 'list_app_plugins': return await listAppPluginsTool(args);
					case 'get_plugin_info': return await getPluginInfoTool(args);
					case 'list_app_themes': return await listAppThemesTool(args);
					case 'list_app_widgets': return await listAppWidgetsTool(args);
					case 'get_routing_config': return await getRoutingConfigTool(args);
					case 'get_system_config': return await getSystemConfigTool(args);
					case 'run_webasyst_cli': return await runWebasystCliTool(args);

					// Creation - basic
					case 'create_app_structure': return await createAppStructureTool(args);
					case 'create_plugin_structure': return await createPluginStructureTool(args);
					case 'create_widget': return await createWidgetTool(args);
					case 'create_action': return await createActionTool(args);
					case 'create_model': return await createModelTool(args);
					case 'create_theme': return await createThemeTool(args);

					// Site
					case 'create_site_plugin': return await createSitePluginTool(args);
					case 'create_site_widget': return await createSiteWidgetTool(args);
					case 'create_site_block': return await createSiteBlockTool(args);
					case 'create_site_theme': return await createSiteThemeTool(args);

					// Shop
					case 'create_shop_plugin': return await createShopPluginTool(args);
					case 'create_shop_theme': return await createShopThemeTool(args);
					case 'create_shipping_plugin': return await createShippingPluginTool(args);
					case 'create_payment_plugin': return await createPaymentPluginTool(args);
					case 'create_shop_report': return await createShopReportTool(args);

					// Generic app external
					case 'create_generic_app': return await createGenericAppTool(args);

					// UI
					case 'enable_webasyst_ui': return await enableWebasystUITool(args);
					case 'create_ui_component': return await createUIComponentTool(args);

					// SEO/Analysis
					case 'setup_seo_optimization': return await setupSeoOptimizationTool(args);
					case 'analyze_project': return await analyzeProjectTool(args);
                    case 'generate_po_template': return await generatePoTemplateTool(args);
                    case 'compile_mo': return await compileMoTool(args);
                    case 'check_project_compliance': return await checkProjectComplianceTool(args);
                    case 'prepare_release_bundle': return await prepareReleaseBundleTool(args);

					// DevOps
					case 'generate_nginx_vhost': return await generateNginxVhostTool(args);
					case 'generate_htaccess': return await generateHtaccessTool(args);

					// UI Validation & Generation
					case 'validate_ui_usage': return await validateUIUsageTool(args);
					case 'generate_color_scheme': return await generateColorSchemeTool(args);
					case 'create_responsive_layout': return await createResponsiveLayoutTool(args);

					default: throw new Error(`Unknown tool: ${name}`);
				}
			} catch (e) {
				return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
			}
		});
	}

	async run() {
		const transport = new StdioServerTransport();
		await this.server.connect(transport);
		console.error('Webasyst MCP Server v2.2.0 started');
	}
}

const server = new WebasystMCPServer();
server.run().catch(console.error);
