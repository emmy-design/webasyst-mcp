#!/usr/bin/env node

/**
 * Упрощенный помощник Webasyst для Cursor
 * Предоставляет быстрые команды для анализа проекта
 */

import fs from 'fs/promises';
import path from 'path';

class WebasystCursorHelper {
  constructor() {
    this.rootPathPromise = this.findWebasystRoot();
  }

  // Найти корневую директорию Webasyst
  async findWebasystRoot() {
    let currentDir = process.cwd();
    
    while (currentDir !== '/') {
      const indexPath = path.join(currentDir, 'index.php');
      const systemPath = path.join(currentDir, 'wa-system');
      
      const hasIndex = await this.fileExists(indexPath);
      const hasSystem = await this.fileExists(systemPath);
      if (hasIndex && hasSystem) {
        return currentDir;
      }
      
      currentDir = path.dirname(currentDir);
    }
    
    return process.cwd(); // fallback
  }

  // Быстрый анализ проекта
  async quickAnalysis() {
    console.log('Анализ Webasyst проекта...\n');
    
    try {
      const rootPath = await this.rootPathPromise;
      // Список приложений
      const appsPath = path.join(rootPath, 'wa-apps');
      const apps = await fs.readdir(appsPath);
      
      console.log(`Найдено приложений: ${apps.length}`);
      for (const app of apps) {
        const configPath = path.join(appsPath, app, 'lib', 'config', 'app.php');
        if (await this.fileExists(configPath)) {
          console.log(`  - ${app}`);
        }
      }
      
      // Системная информация
      console.log('\nСистемная информация:');
      console.log(`  - Корневая папка: ${rootPath}`);
      console.log(`  - PHP файлы: ${await this.countFiles('**/*.php')}`);
      console.log(`  - CSS файлы: ${await this.countFiles('**/*.css')}`);
      console.log(`  - JS файлы: ${await this.countFiles('**/*.js')}`);
      
    } catch (error) {
      console.error('Ошибка анализа:', error.message);
    }
  }

  // Создать шаблон приложения (упрощенно)
  async createAppTemplate(appId, appName) {
    console.log(`Создание приложения ${appName} (${appId})...`);
    
    const rootPath = await this.rootPathPromise;
    const appPath = path.join(rootPath, 'wa-apps', appId);
    
    try {
      // Проверяем существование
      if (await this.fileExists(appPath)) {
        console.log('Ошибка: Приложение уже существует');
        return;
      }
      
      // Создаем базовую структуру
      await fs.mkdir(path.join(appPath, 'lib', 'config'), { recursive: true });
      await fs.mkdir(path.join(appPath, 'lib', 'actions', 'backend'), { recursive: true });
      await fs.mkdir(path.join(appPath, 'lib', 'classes'), { recursive: true });
      await fs.mkdir(path.join(appPath, 'lib', 'models'), { recursive: true });
      await fs.mkdir(path.join(appPath, 'templates', 'actions', 'backend'), { recursive: true });
      await fs.mkdir(path.join(appPath, 'css'), { recursive: true });
      await fs.mkdir(path.join(appPath, 'js'), { recursive: true });
      await fs.mkdir(path.join(appPath, 'img'), { recursive: true });
      await fs.mkdir(path.join(appPath, 'locale'), { recursive: true });
      
      // Создаем app.php
      const appConfig = `<?php
return array(
    'name' => '${appName}',
    'icon' => array(
        48 => 'img/${appId}48.png',
        96 => 'img/${appId}96.png',
    ),
    'version' => '1.0.0',
    'vendor' => 'custom',
    'ui' => '2.0',
);
`;
      
      await fs.writeFile(path.join(appPath, 'lib', 'config', 'app.php'), appConfig);
      
      console.log(`Приложение создано: ${appPath}`);
      
    } catch (error) {
      console.error('Ошибка создания:', error.message);
    }
  }

  // Показать структуру приложения
  async showAppStructure(appId) {
    console.log(`Структура приложения ${appId}:\n`);
    
    const rootPath = await this.rootPathPromise;
    const appPath = path.join(rootPath, 'wa-apps', appId);
    
    if (!await this.fileExists(appPath)) {
      console.log('Ошибка: Приложение не найдено');
      return;
    }
    
    await this.printDirectoryTree(appPath, '', 0, 3);
  }

  // Вспомогательные методы
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async countFiles(pattern) {
    // Упрощенный подсчет - в реальности нужна библиотека glob
    return '~'; // placeholder
  }

  async printDirectoryTree(dirPath, prefix = '', depth = 0, maxDepth = 3) {
    if (depth > maxDepth) return;
    
    try {
      const items = await fs.readdir(dirPath);
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemPath = path.join(dirPath, item);
        const isLast = i === items.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        
        console.log(prefix + connector + item);
        
        const stats = await fs.stat(itemPath);
        if (stats.isDirectory() && depth < maxDepth) {
          const newPrefix = prefix + (isLast ? '    ' : '│   ');
          await this.printDirectoryTree(itemPath, newPrefix, depth + 1, maxDepth);
        }
      }
    } catch (error) {
      console.log(prefix + '└── [ошибка чтения]');
    }
  }
}

// CLI интерфейс
const helper = new WebasystCursorHelper();
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

switch (command) {
  case 'analyze':
  case 'a':
    await helper.quickAnalysis();
    break;
    
  case 'create':
  case 'c':
    if (!arg1 || !arg2) {
      console.log('Использование: node cursor-helper.js create <app_id> <app_name>');
    } else {
      await helper.createAppTemplate(arg1, arg2);
    }
    break;
    
  case 'structure':
  case 's':
    if (!arg1) {
      console.log('Использование: node cursor-helper.js structure <app_id>');
    } else {
      await helper.showAppStructure(arg1);
    }
    break;
    
  default:
    console.log(`
Webasyst Helper для Cursor

Команды:
  analyze, a           - Быстрый анализ проекта
  create, c <id> <name> - Создать приложение
  structure, s <id>    - Показать структуру приложения

Примеры:
  node cursor-helper.js analyze
  node cursor-helper.js create portfolio "Портфолио"
  node cursor-helper.js structure shop
`);
}
