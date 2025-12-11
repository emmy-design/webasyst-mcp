# Руководство по локализации Webasyst

## Содержание
1. [Основные принципы](#основные-принципы)
2. [Структура локализации](#структура-локализации)
3. [Backend локализация (PHP)](#backend-локализация-php)
4. [Frontend локализация (JavaScript)](#frontend-локализация-javascript)
5. [Правильная реализация по стандартам Webasyst](#правильная-реализация-по-стандартам-webasyst)
6. [Примеры из реальных приложений](#примеры-из-реальных-приложений)
7. [Частые ошибки](#частые-ошибки)

## Основные принципы

### Правила Webasyst для локализации:

1. **Разделение backend и frontend локализации**
2. **Использование отдельных action/controller для JS строк**
3. **Кэширование локализации для производительности**
4. **Поддержка плюрализации**

## Структура локализации

```
wa-apps/
└── your-app/
    ├── locale/                      # Файлы переводов
    │   ├── en_US/
    │   │   └── LC_MESSAGES/
    │   │       └── your-app.po
    │   └── ru_RU/
    │       └── LC_MESSAGES/
    │           └── your-app.po
    ├── lib/
    │   └── actions/
    │       └── backend/
    │           ├── appBackendLoc.action.php      # Правильный подход
    │           └── appBackendLoc.controller.php  # Правильный подход
    └── templates/
        └── actions/
            └── backend/
                └── BackendLoc.html        # Шаблон для JS локализации

```

## Backend локализация (PHP)

### Функции локализации:
- `_w()` — для строк приложения (используется в `lib/` приложения)
- `_wp()` — для строк плагина (используется в `plugins/*/lib/`)
- `_ws()` — для системных строк ядра Webasyst (`wa-system/locale`)

### В PHP файлах используйте соответствующую функцию:

```php
// Простая строка
echo _w('Save');

// С подстановкой
echo sprintf(_w('Welcome, %s!'), $username);

// Плюрализация
echo _w('%d item', '%d items', $count);
```

## Frontend локализация (JavaScript)

### Неправильно (старый подход):
```html
<!-- В основном шаблоне Backend.html -->
<script type="application/json" id="locale-json">{json_encode([
    'Save' => _w('Save'),
    'Cancel' => _w('Cancel'),
    // ... сотни строк ...
])}</script>
```

### Правильно (стандарт Webasyst):

#### 1. Создайте Action для локализации:

```php
<?php
// lib/actions/backend/designerBackendLoc.action.php

class designerBackendLocAction extends waViewAction
{
    public function execute()
    {
        $strings = array();

        // Основные строки приложения
        foreach(array(
            'Save',
            'Cancel', 
            'Delete',
            'Are you sure?',
            'Loading...',
            'Error',
            'Success',
            // ... остальные строки
        ) as $s) {
            $strings[$s] = _w($s);
        }

        // Плюрализация
        foreach ($this->getPlurals() as $pair) {
            $strings[$pair[0]] = array(
                _w($pair[0]),
                str_replace(2, '%d', _w($pair[0], $pair[1], 2)),
                str_replace(5, '%d', _w($pair[0], $pair[1], 5))
            );
        }

        $this->view->assign('strings', $strings ?: new stdClass());
        $this->getResponse()->addHeader('Content-Type', 'text/javascript; charset=utf-8');
    }

    public function getPlurals()
    {
        return array(
            array/*_w*/('%d item selected', '%d items selected'),
            array/*_w*/('%d photo imported', '%d photos imported'),
            array/*_w*/('%d file', '%d files')
        );
    }
}
```

#### 2. Создайте Controller:

```php
<?php
// lib/actions/backend/designerBackendLoc.controller.php

class designerBackendLocController extends waViewController
{
    public function execute()
    {
        $this->executeAction(new designerBackendLocAction());
    }

    public function preExecute()
    {
        // Не сохраняем эту страницу как последнюю посещенную
    }
}
```

#### 3. Создайте шаблон:

```html
<!-- templates/actions/backend/BackendLoc.html -->
$.wa.locale = $.extend($.wa.locale, {$strings|json_encode});
```

#### 4. Подключите в основном шаблоне:

```html
<!-- templates/actions/backend/Backend.html -->
<!DOCTYPE html>
<html>
<head>
    <!-- Подключение локализации ПЕРЕД основными скриптами -->
    <script type="text/javascript" src="?action=loc"></script>
    
    <!-- Ваши скрипты -->
    <script src="{$wa_app_static_url}js/app.js"></script>
</head>
```

#### 5. Используйте в JavaScript:

```javascript
// Использование через глобальную функцию $_()
alert($_('Are you sure?'));

// Или через объект $.wa.locale
var message = $.wa.locale['Loading...'];

// Плюрализация
function pluralize(key, count) {
    var forms = $.wa.locale[key];
    if (!Array.isArray(forms)) return key;
    
    // Простая логика для русского языка
    var mod10 = count % 10;
    var mod100 = count % 100;
    
    if (mod10 === 1 && mod100 !== 11) return forms[0].replace('%d', count);
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1].replace('%d', count);
    return forms[2].replace('%d', count);
}

console.log(pluralize('%d item selected', 5)); // "5 элементов выбрано"
```

## Правильная реализация по стандартам Webasyst

### Преимущества стандартного подхода:

1. **Производительность** - локализация загружается отдельным запросом и кэшируется
2. **Чистота кода** - разделение логики и представления
3. **Масштабируемость** - легко добавлять новые языки
4. **Совместимость** - работает со всеми инструментами Webasyst

### Структура проекта с правильной локализацией:

```
wa-apps/designer/
├── lib/
│   ├── actions/
│   │   └── backend/
│   │       ├── designerBackendLoc.action.php      # Обработчик локализации
│   │       ├── designerBackendLoc.controller.php  # Контроллер
│   │       └── designerBackend.action.php         # Основной action
│   └── config/
│       └── app.php                                # Конфигурация приложения
├── templates/
│   └── actions/
│       └── backend/
│           ├── BackendLoc.html                    # Шаблон локализации
│           └── Backend.html                       # Основной шаблон
├── js/
│   └── app.js                                     # JS с использованием $_()
└── locale/
    ├── en_US/
    │   └── LC_MESSAGES/
    │       └── designer.po                        # Английские переводы
    └── ru_RU/
        └── LC_MESSAGES/
            └── designer.po                        # Русские переводы
```

## Примеры из реальных приложений

### Shop-Script (`shopBackendLoc.action.php`):
```php
class shopBackendLocAction extends waViewAction
{
    public function execute()
    {
        $strings = array();
        
        foreach(array(
            'SKUs: %d',
            'Parameters: %s',
            'Customize',
            'Plugins',
            'Are you sure?',
            'Close',
            'Cancel',
            'Delete',
            'Save',
            'Loading',
            // ... много строк
        ) as $s) {
            $strings[$s] = _w($s);
        }

        // Плюрализация
        foreach ($this->getPlurals() as $pair) {
            $strings[$pair[0]] = array(
                _w($pair[0]),
                str_replace(2, '%d', _w($pair[0], $pair[1], 2)),
                str_replace(5, '%d', _w($pair[0], $pair[1], 5))
            );
        }

        $this->view->assign('strings', $strings ?: new stdClass());
        $this->getResponse()->addHeader('Content-Type', 'text/javascript; charset=utf-8');
    }
}
```

### Site (`siteBackendLoc.action.php`):
```php
class siteBackendLocAction extends waViewAction
{
    public function execute()
    {
        $strings = array();

        // Строки приложения
        foreach(array(
            'File URL',
            'Download',
            'Rename',
            'Move to folder',
            'Delete',
            'Saving...',
            'Saved',
            'An error occurred while saving',
        ) as $s) {
            $strings[$s] = _w($s);
        }

        // Системные строки (из wa-system)
        $strings['Save'] = _ws('Save');
        $strings['Cancel'] = _ws('Cancel');

        $this->view->assign('strings', $strings ?: new stdClass());
        $this->getResponse()->addHeader('Content-Type', 'text/javascript; charset=utf-8');
    }
}
```

## Частые ошибки

### Ошибка 1: Встраивание локализации в основной шаблон
```html
<!-- Неправильно -->
<script>
var locale = {
    save: '{_w("Save")}',
    cancel: '{_w("Cancel")}'
};
</script>
```

### Ошибка 2: Дублирование строк
```php
// В разных местах кода
echo _w('Сохранить');  // Файл 1
echo _w('сохранить');  // Файл 2
echo _w('Save');       // Файл 3
// Используйте одинаковые ключи!
```

### Ошибка 3: Хардкод строк в JavaScript
```javascript
// Неправильно
alert('Вы уверены?');

// Правильно
alert($_('Are you sure?'));
```

### Ошибка 4: Неправильная плюрализация
```php
// Неправильно
echo $count . ' ' . _w('items');

// Правильно
echo _w('%d item', '%d items', $count);
```

## Рекомендации для разработчиков

1. **Всегда используйте английские ключи** для строк локализации
2. **Группируйте связанные строки** в action файле
3. **Кэшируйте локализацию** на клиенте
4. **Тестируйте плюрализацию** для разных языков
5. **Документируйте контекст** для переводчиков

## Инструменты для работы с локализацией

### Создание .po файлов:
```bash
# Извлечение строк из PHP
xgettext -o locale/designer.pot --from-code=UTF-8 -L PHP --keyword=_w:1 --keyword=_w:1,2 lib/**/*.php

# Создание/обновление .po файла для языка
msgmerge -U locale/ru_RU/LC_MESSAGES/designer.po locale/designer.pot
```

### Компиляция .po в .mo:
```bash
msgfmt locale/ru_RU/LC_MESSAGES/designer.po -o locale/ru_RU/LC_MESSAGES/designer.mo
```

## Проверочный чек-лист

- [ ] Создан `BackendLoc.action.php`
- [ ] Создан `BackendLoc.controller.php`
- [ ] Создан шаблон `BackendLoc.html`
- [ ] Подключен `<script src="?action=loc"></script>`
- [ ] Все JS строки используют `$_()`
- [ ] Настроена плюрализация где нужно
- [ ] Созданы .po файлы для всех языков
- [ ] Протестировано переключение языков

## Полезные ссылки

- [Документация Webasyst по локализации](https://developers.webasyst.ru/docs/localization/)
- [GNU gettext](https://www.gnu.org/software/gettext/manual/)
- [Poedit - редактор .po файлов](https://poedit.net/)

---

**Важно:** Следование этим стандартам обеспечит совместимость вашего приложения с экосистемой Webasyst и упростит поддержку многоязычности.
