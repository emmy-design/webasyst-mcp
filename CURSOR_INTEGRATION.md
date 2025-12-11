# Интеграция Webasyst MCP с Cursor

## Два подхода к работе с Webasyst в Cursor

### Нужен ли MCP в Cursor?

**Короткий ответ:** Для большинства задач - нет, достаточно упрощенного помощника.

**Длинный ответ:** Зависит от ваших задач:

## Сравнение подходов

| Задача | Cursor встроенные | Cursor Helper | Полный MCP |
|--------|------------------|---------------|------------|
| Редактирование файлов | Лучший | - | - |
| Анализ структуры | Базовый | Хороший | Отличный |
| Создание приложений | - | Быстро | Полный функционал |
| Работа с CSS/HTML | Отлично | - | - |
| Планирование архитектуры | - | Базовый | Отлично |

## Рекомендуемый подход для дизайнера

### Вариант 1: Cursor Helper (рекомендуется)

Используйте упрощенный помощник прямо в терминале Cursor:

```bash
# Анализ проекта
node webasyst-mcp/cursor-helper.js analyze

# Создание приложения
node webasyst-mcp/cursor-helper.js create portfolio "Портфолио"

# Структура приложения
node webasyst-mcp/cursor-helper.js structure shop
```

## Как стилизовать элементы интерфейса при разработке

### ОБЯЗАТЕЛЬНЫЕ ПРАВИЛА:
1. **ВСЕГДА используйте компоненты из `wa-apps/ui/`**
2. **ВСЕГДА применяйте классы из `wa-content/css/wa/wa-2.0.css`**
3. **НИКОГДА не хардкодьте цвета - используйте CSS-переменные**

Используйте приложение `ui` как живую библиотеку примеров:

- Примеры разметки: `wa-apps/ui/templates/actions/component/`
- Основные стили: `wa-content/css/wa/wa-2.0.css`
- Полезные файлы по категориям:
  - Переключатели: `switch.html`, `toggle.html`
  - Выпадающие списки и селекты: `dropdown.html`, `inputs.html`
  - Таблицы: `table.html`, `tablebox.html`
  - Карточки: `card.html`
  - Кирпичи (bricks): `bricks.html`
  - Диалоги/панели/подсказки: `dialog.html`, `drawer.html`, `tooltip.html`
  - Загрузка/прогресс: `loading.html`, `spinner.html`, `progressbar.html`

Подключение базовых стилей UI:

```smarty
{include file="ui_wrapper.html"}
```

или вручную:

```html
<link rel="stylesheet" href="{$wa_app_static_url}wa-ui-variables.css">
```

Рекомендации:
- Используйте `id` в JS для поиска элементов
- Опирайтесь на CSS-переменные UI 2.0 для цветов и типографики
- Минимизируйте кастомные стили для лучшей производительности

Подробнее: [UI_COMPONENTS_REFERENCE.md](UI_COMPONENTS_REFERENCE.md)

**Преимущества:**
- Быстро и просто
- Не требует настройки MCP
- Интегрируется с терминалом Cursor
- Подходит для 80% задач

### Вариант 2: Полный MCP (для сложных проектов)

Если работаете с большими проектами или командой:

1. Настройте MCP в Claude Desktop (по инструкции в README.md)
2. Используйте Claude для планирования
3. Cursor для реализации

## Практические примеры

### Типичный рабочий процесс дизайнера:

#### 1. Анализ проекта в Cursor
```bash
# В терминале Cursor
cd /path/to/webasyst-project
node webasyst-mcp/cursor-helper.js analyze
```

#### 2. Создание нового приложения
```bash
# Создать структуру
node webasyst-mcp/cursor-helper.js create gallery "Фотогалерея"

# Посмотреть что создалось
node webasyst-mcp/cursor-helper.js structure gallery
```

#### 3. Работа с файлами в Cursor
- Открыть созданные файлы в Cursor
- Редактировать CSS, HTML, PHP с помощью AI Cursor
- Использовать встроенные инструменты поиска/замены

## Команды Cursor Helper

### Основные команды:
```bash
# Полный анализ проекта
node cursor-helper.js analyze

# Создать приложение
node cursor-helper.js create <app_id> "<app_name>"

# Показать структуру
node cursor-helper.js structure <app_id>

# Справка
node cursor-helper.js
```

### Примеры:
```bash
# Анализ текущего проекта
node cursor-helper.js a

# Создать приложение для блога
node cursor-helper.js c blog "Личный блог"

# Посмотреть структуру магазина
node cursor-helper.js s shop
```

## Быстрая настройка в Cursor

### 1. Создайте алиас в терминале:
```bash
# Добавьте в ~/.zshrc или ~/.bashrc
alias wh="node webasyst-mcp/cursor-helper.js"
```

### 2. Теперь команды еще короче:
```bash
wh a           # анализ
wh c blog "Блог"  # создать приложение
wh s shop      # структура
```

### 3. Создайте задачи в Cursor:
В `.vscode/tasks.json` (если используете VS Code режим):
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Webasyst: Анализ проекта",
      "type": "shell",
      "command": "node",
      "args": ["webasyst-mcp/cursor-helper.js", "analyze"],
      "group": "build"
    }
  ]
}
```

## Когда использовать каждый подход

### Cursor Helper для:
- Быстрый анализ структуры
- Создание базовых приложений
- Ежедневная разработка
- Простые задачи

### Полный MCP для:
- Сложное планирование архитектуры
- Командная работа
- Анализ больших проектов
- Интеграция с Claude Desktop

### Встроенные инструменты Cursor для:
- Редактирование кода
- Рефакторинг
- Поиск и замена
- Работа с CSS/HTML

## Совет

**Для вас как дизайнера с базовыми навыками HTML/CSS:**

1. **Начните с Cursor Helper** - он покрывает 80% потребностей
2. **Используйте встроенные инструменты Cursor** для редактирования
3. **Рассмотрите полный MCP** только если проекты станут сложными

Это даст вам лучшее из двух миров: простоту Cursor + мощь специализированных инструментов для Webasyst.
