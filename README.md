# Webasyst MCP Server

MCP (Model Context Protocol) сервер для работы с фреймворком Webasyst. Предоставляет инструменты для управления приложениями, плагинами, темами и конфигурацией через AI-интерфейс.

## Стандарты разработки

**ВАЖНО:** Перед началом работы обязательно ознакомьтесь со [СТАНДАРТАМИ РАЗРАБОТКИ](DEVELOPMENT_STANDARDS.md)
Также перед ревью используйте чек-лист: [PR_CHECKLIST.md](PR_CHECKLIST.md)

## Возможности

### Управление приложениями
- Получение списка всех приложений
- Детальная информация о приложениях
- Создание структуры новых приложений

### Работа с плагинами
- Список плагинов для каждого приложения
- Информация о конкретных плагинах
- Создание структуры новых плагинов

### Управление темами
- Список доступных тем для приложений
- Информация о темах оформления

### Конфигурация
- Системная конфигурация
- Конфигурация маршрутизации
- Настройки приложений

### CLI интерфейс
- Выполнение команд через CLI Webasyst
- Автоматизация задач разработки

## Установка

1. Убедитесь, что у вас установлен Node.js версии 18 или выше:
   ```bash
   node --version
   ```

2. Перейдите в директорию с MCP сервером:
   ```bash
   cd webasyst-mcp
   ```

3. Установите зависимости:
   ```bash
   npm install
   ```

4. Сделайте файл исполняемым:
   ```bash
   chmod +x webasyst-mcp.js
   ```

## Использование

### Запуск сервера
```bash
npm start
```

### Интеграция с Claude Desktop

Добавьте следующую конфигурацию в файл `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "webasyst": {
      "command": "node",
      "args": ["/путь/к/вашему/проекту/webasyst-mcp/webasyst-mcp.js"],
      "env": {}
    }
  }
}
```

## Доступные инструменты

**Информация**
- `list_webasyst_apps` — приложения (include_system).
- `get_app_info` — детали приложения (app_id).
- `list_app_plugins`, `get_plugin_info` — плагины приложения (app_id, plugin_id).
- `list_app_themes`, `list_app_widgets` — темы/виджеты приложения (app_id).
- `get_routing_config` — маршрутизация (app_id опционально).
- `get_system_config` — системная конфигурация.
- `run_webasyst_cli` — запуск `cli.php` (command, args).

**Создание (базовое)**
- `create_app_structure`, `create_plugin_structure`.
- `create_action`, `create_model`, `create_theme`, `create_widget` (Dashboard).
- `create_generic_app` — приложение в произвольном пути.

**Site**
- `create_site_plugin`, `create_site_widget`, `create_site_block`, `create_site_theme`.

**Shop**
- `create_shop_plugin`, `create_shop_theme`, `create_shop_report`.
- `create_shipping_plugin` (wa-plugins/shipping), `create_payment_plugin` (wa-plugins/payment).

**UI**
- `enable_webasyst_ui` — подключение UI 2.0.
- `create_ui_component` — таблица/форма/модалка и др.

**SEO и аналитика**
- `setup_seo_optimization`, `analyze_project`.
- `generate_po_template`, `compile_mo`, `check_project_compliance`, `prepare_release_bundle`.

**DevOps**
- `generate_nginx_vhost`, `generate_htaccess`.

## Примеры использования

После интеграции с Claude Desktop вы можете использовать следующие команды:

```
Покажи мне все приложения Webasyst
```

```
Создай новое приложение с ID "myapp" и названием "Мое приложение"
```

```
Покажи информацию о приложении "shop"
```

```
Создай плагин "analytics" для приложения "shop" с названием "Аналитика продаж"
```

## Структура проекта

```
webasyst-mcp/
├── webasyst-mcp.js    # Основной файл MCP сервера
├── package.json       # Конфигурация npm пакета
├── README.md          # Документация
└── node_modules/      # Зависимости (после npm install)
```

## Требования

- Node.js >= 18.0.0
- Проект Webasyst с корректной структурой директорий
- Права на чтение/запись в директории проекта

## Особенности для дизайнеров

Этот MCP сервер особенно полезен для дизайнеров и продуктовых менеджеров, работающих с Webasyst:

- **Простой интерфейс**: Все команды выполняются через естественный язык в Claude
- **Автоматизация**: Создание структуры приложений и плагинов одной командой
- **Безопасность**: Все изменения сохраняются только локально в git
- **Интуитивность**: Не требует глубоких знаний PHP - достаточно базового понимания HTML/CSS
- **UI гайдлайны**: Рекомендации по использованию Webasyst UI 2.0 (см. [UI_COMPONENTS_REFERENCE.md](UI_COMPONENTS_REFERENCE.md))
- **Локализация**: Правила и стандарты локализации Webasyst (см. [LOCALIZATION_GUIDE.md](LOCALIZATION_GUIDE.md))

## Стилизация интерфейса (UI 2.0)

### ОБЯЗАТЕЛЬНОЕ ТРЕБОВАНИЕ:
**При создании интерфейсов ВСЕГДА используйте:**
1. **Компоненты из `wa-apps/ui/`** - готовые шаблоны и примеры
2. **Классы из `wa-content/css/wa/wa-2.0.css`** - основные стили системы
3. **CSS-переменные** вместо хардкода цветов

- **Где смотреть примеры**: `wa-apps/ui/templates/actions/component/`
  > Если приложение UI не установлено, установите его через Инсталлер (`?module=store&action=product&slug=ui`)
- **Основные стили**: `wa-content/css/wa/wa-2.0.css`
- **Полный справочник компонентов**: [UI_COMPONENTS_REFERENCE.md](UI_COMPONENTS_REFERENCE.md)
- **Чек-лист PR**: [PR_CHECKLIST.md](PR_CHECKLIST.md)
- **Быстрая навигация по компонентам**:
  - **Переключатели**: `switch.html`, `toggle.html`
  - **Селекты и выпадающие списки**: `dropdown.html`, `inputs.html`
  - **Таблицы**: `table.html`, `tablebox.html`
  - **Карточки**: `card.html`
  - **Кирпичи/brick-сетка**: `bricks.html`
  - **Загрузка и прогресс**: `loading.html`, `spinner.html`, `progressbar.html`
  - **Диалоги и выдвижные панели**: `dialog.html`, `drawer.html`, `tooltip.html`

- **Подключение базовых стилей UI**:

```smarty
{include file="ui_wrapper.html"}
```

или вручную в layout:

```html
<link rel="stylesheet" href="{$wa_app_static_url}wa-ui-variables.css">
```

- **Рекомендации**:
  - Для JS старайтесь искать элементы по `id`, а не по классам
  - Минимизируйте кастомные стили; используйте CSS-переменные UI 2.0
  - Опираться на готовую разметку из файлов в `wa-apps/ui/templates/actions/component/`

Подробнее: [UI_COMPONENTS_REFERENCE.md](UI_COMPONENTS_REFERENCE.md)

## Поддержка

Если у вас возникли вопросы или проблемы:
1. Проверьте, что вы находитесь в корневой директории проекта Webasyst
2. Убедитесь, что Node.js установлен и имеет версию 18+
3. Проверьте права доступа к файлам проекта

## Авторы

- **Vlad Arkhipov** — создатель и основной разработчик

## Благодарности

Проект создан на основе официальных материалов [Webasyst](https://www.webasyst.ru/):

- [Документация разработчика](https://developers.webasyst.ru/docs/) — использовалась как база для стандартов и структуры генерируемого кода
- [Приложение UI](https://www.webasyst.ru/store/app/ui/) — дизайн-система Webasyst 2.0, на основе которой создан справочник компонентов

## Участие в разработке

Мы приветствуем вклад в проект! См. [CONTRIBUTING.md](CONTRIBUTING.md) для деталей.

## Лицензия

MIT License — см. файл [LICENSE](LICENSE)
