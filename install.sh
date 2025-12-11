#!/bin/bash

# Скрипт установки Webasyst MCP Server
# Для дизайнеров и продуктовых менеджеров

echo "Установка Webasyst MCP Server..."

# Проверяем версию Node.js
if ! command -v node &> /dev/null; then
    echo "Ошибка: Node.js не найден. Пожалуйста, установите Node.js версии 18 или выше."
    echo "Скачать можно здесь: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Ошибка: Требуется Node.js версии 18 или выше. Текущая версия: $(node --version)"
    echo "Пожалуйста, обновите Node.js: https://nodejs.org/"
    exit 1
fi

echo "Node.js $(node --version) найден"

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "Ошибка: Файл package.json не найден. Убедитесь, что вы находитесь в директории webasyst-mcp"
    exit 1
fi

# Устанавливаем зависимости
echo "Устанавливаем зависимости..."
npm install

if [ $? -ne 0 ]; then
    echo "Ошибка при установке зависимостей"
    exit 1
fi

# Делаем файл исполняемым
chmod +x webasyst-mcp.js

echo ""
echo "Установка завершена успешно!"
echo ""
echo "Следующие шаги:"
echo "1. Откройте Claude Desktop"
echo "2. Перейдите в настройки (Settings)"
echo "3. Найдите раздел 'Developer' или 'MCP Servers'"
echo "4. Добавьте новый сервер с конфигурацией:"
echo ""
echo "   {"
echo "     \"mcpServers\": {"
echo "       \"webasyst\": {"
echo "         \"command\": \"node\","
echo "         \"args\": [\"$(pwd)/webasyst-mcp.js\"],"
echo "         \"env\": {}"
echo "       }"
echo "     }"
echo "   }"
echo ""
echo "5. Перезапустите Claude Desktop"
echo ""
echo "Готово! Теперь вы можете использовать команды типа:"
echo "   - 'Покажи все приложения Webasyst'"
echo "   - 'Создай новое приложение myapp'"
echo "   - 'Покажи плагины для приложения shop'"
echo ""
echo "Полная документация доступна в README.md"
