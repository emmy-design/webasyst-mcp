# Справочник компонентов Webasyst UI 2.0

## ВАЖНО: Обязательное использование

**ВСЕ интерфейсы ДОЛЖНЫ использовать:**
1. Компоненты из `wa-apps/ui/templates/actions/component/`
2. Классы из `wa-content/css/wa/wa-2.0.css`
3. CSS-переменные для цветов и размеров

## Подключение стилей

### Обязательное подключение wa-2.0.css:
```html
<!-- В head вашего шаблона -->
<link rel="stylesheet" href="{$wa_url}wa-content/css/wa/wa-2.0.css">
```

### Или через стандартный хелпер:
```smarty
{wa_header()}
```

### Или через wrapper:
```smarty
{include file="ui_wrapper.html"}
```

### Подключение JS-хелперов UI 2.0
```html
<!-- Диалоги, дропдауны, тултипы -->
<script src="{$wa_url}wa-apps/ui/js/dialog.js"></script>
<script src="{$wa_url}wa-apps/ui/js/dropdown.js"></script>
<script src="{$wa_url}wa-apps/ui/js/tooltip.js"></script>
```
> Рекомендуется подключать хелперы один раз в layout. В скриптах ищите элементы по `id` для стабильности.

## Структура страницы и меню приложений

### Базовая структура шаблона

```html
<body>
    <div id="wa">
        {$wa->header()}
        
        <div id="wa-app">
            <!-- ВАШ КОНТЕНТ -->
            <div class="flexbox">
                <div class="sidebar">Навигация</div>
                <div class="content">Контент</div>
            </div>
            <!-- /ВАШ КОНТЕНТ -->
        </div>
    </div>
</body>
```

### {$wa->header()} — Меню приложений

Верхнее меню навигации Webasyst. Всегда находится вверху экрана (`position: fixed; top: 0;`) с высотой `4rem`.

**Базовый вызов:**
```smarty
{$wa->header()}
```

**Custom режим (собственная навигация вместо иконок приложений):**
```smarty
{$wa->header([
    'custom' => [
        'main' => '<nav>Ваша навигация</nav>',
        'aux' => '<button class="button small">Upgrade</button>'
    ]
])}
```

- `'main'` — HTML вместо горизонтального меню приложений (иконки останутся в развёрнутом виде)
- `'aux'` — HTML справа от меню (например, кнопка или переключатель)

**Single App Mode:**
```smarty
{if $wa->isSingleAppMode()}
    <!-- Режим одного приложения (без верхнего меню) -->
{/if}
```

**Важно:**
- Выше `{$wa->header()}` не может быть других элементов
- Для приложений в экосистеме Webasyst наличие `{$wa->header()}` обязательно
- Для собственных AaaS-сервисов можно полностью отказаться от `{$wa->header()}`

## Определение интерфейса 1.3 / 2.0

- В `wa-apps/APP_ID/lib/config/app.php` задайте `'ui' => '2.0' | '1.3' | '1.3, 2.0'`.
- Шаблоны: `templates/actions/` — для 2.0, `templates/actions-legacy/` — для 1.3 (создаются параллельно).
- Для явных путей используйте `setTemplate("path.html", true)` — путь относительно `actions/`, legacy возьмётся автоматически.
- Хелпер для проверки режима: `wa()->whichUI($app_id)`; для single app — `wa()->isSingleAppMode()`.
- Плагины повторяют логику приложений (используйте одинаковые ветки `actions/` и `actions-legacy/`).

## Где найти компоненты и стили

### Основные источники:
- **Примеры компонентов**: `wa-apps/ui/templates/actions/component/`
- **Основные стили**: `wa-content/css/wa/wa-2.0.css`
- **Ядро JS**: `wa-content/js/jquery-wa/wa.js`
- **Дополнительные JS-компоненты**: `wa-apps/ui/js/` (dialog.js, dropdown.js и др.)
- **Живая документация**: приложение UI в вашем Webasyst

> **Важно:** Приложение UI (`wa-apps/ui`) может быть не установлено. 
> Установите его через Инсталлер: Webasyst → Инсталлер → Поиск "UI" 
> или по прямой ссылке: `?module=store&action=product&slug=ui`

## Компоненты по категориям

### 1. Кнопки и действия

#### Из `button.html`:
```html
<!-- Основная кнопка -->
<button type="button" class="button blue">Сохранить</button>

<!-- Вторичная кнопка -->
<button type="button" class="button light-gray">Отмена</button>

<!-- Опасная кнопка -->
<button type="button" class="button red">Удалить</button>

<!-- Кнопка успеха -->
<button type="button" class="button green">Готово</button>

<!-- Маленькая кнопка -->
<button type="button" class="button small">Действие</button>

<!-- Кнопка с иконкой -->
<button type="button" class="button">
    <i class="wa-icon wa-icon-plus"></i> Добавить
</button>

<!-- Кнопка загрузки -->
<button type="button" class="button" disabled>
    <i class="wa-icon wa-icon-spinner fa-spin"></i> Загрузка...
</button>
```

### 2. Формы и поля ввода

#### Из `inputs.html`:
```html
<!-- Текстовое поле -->
<div class="field">
    <div class="name">Название</div>
    <div class="value">
        <input type="text" class="bold" placeholder="Введите название">
    </div>
</div>

<!-- Textarea -->
<div class="field">
    <div class="name">Описание</div>
    <div class="value">
        <textarea rows="5" placeholder="Введите описание"></textarea>
    </div>
</div>

<!-- Select -->
<div class="field">
    <div class="name">Категория</div>
    <div class="value">
        <select>
            <option>Выберите категорию</option>
            <option>Категория 1</option>
            <option>Категория 2</option>
        </select>
    </div>
</div>
```

### 3. Чекбоксы и переключатели

#### Из `switch.html` и `toggle.html`:
```html
<!-- Чекбокс -->
<label class="flexbox middle">
    <span>
        <input type="checkbox">
    </span>
    <span>Включить опцию</span>
</label>

<!-- Переключатель (switch) — требует JS-инициализации -->
<span class="switch" id="my-switch">
    <input type="checkbox" name="status" checked>
</span>

<script>
    $("#my-switch").waSwitch({
        change: function(active, wa_switch) {
            console.log("Переключатель:", active ? "ВКЛ" : "ВЫКЛ");
        }
    });
</script>

<!-- Радиокнопки -->
<label class="flexbox middle">
    <span>
        <input type="radio" name="option">
    </span>
    <span>Вариант 1</span>
</label>
```

**Важно:** Компонент `.switch` требует подключения `wa-content/js/jquery-wa/wa.js` и инициализации через `$.waSwitch()`.

#### Стилизованные элементы форм (.wa-checkbox, .wa-radio, .wa-select)

Для кастомной стилизации чекбоксов, радиокнопок и селектов используйте специальные классы:

**Стилизованный чекбокс (.wa-checkbox):**
```html
<label>
    <span class="wa-checkbox">
        <input type="checkbox" checked>
        <span>
            <span class="icon">
                <i class="wa-icon wa-icon-check"></i>
            </span>
        </span>
    </span>
    Текст чекбокса
</label>

<!-- Отключённый чекбокс -->
<label>
    <span class="wa-checkbox">
        <input type="checkbox" disabled>
        <span>
            <span class="icon">
                <i class="wa-icon wa-icon-check"></i>
            </span>
        </span>
    </span>
    Отключённый чекбокс
</label>
```

**Стилизованные радиокнопки (.wa-radio):**
```html
<label>
    <span class="wa-radio">
        <input type="radio" name="option">
        <span></span>
    </span>
    Вариант 1
</label>
<label>
    <span class="wa-radio">
        <input type="radio" name="option">
        <span></span>
    </span>
    Вариант 2
</label>

<!-- Отключённая радиокнопка -->
<label>
    <span class="wa-radio">
        <input type="radio" name="option" disabled>
        <span></span>
    </span>
    Отключённый вариант
</label>
```

**Стилизованный селект (.wa-select):**
```html
<div class="wa-select">
    <select name="city">
        <option value="">Выберите город</option>
        <option value="moscow">Москва</option>
        <option value="spb">Санкт-Петербург</option>
    </select>
</div>

<!-- С состоянием ошибки -->
<div class="wa-select">
    <select class="state-error">
        <option value="">Ошибка валидации</option>
    </select>
</div>

<!-- С состоянием успеха -->
<div class="wa-select">
    <select class="state-success">
        <option value="">Успешно</option>
    </select>
</div>

<!-- С состоянием предупреждения -->
<div class="wa-select">
    <select class="state-caution">
        <option value="">Внимание</option>
    </select>
</div>

<!-- Без обводки -->
<div class="wa-select">
    <select class="outlined">
        <option value="">Минималистичный стиль</option>
    </select>
</div>
```

**Примечание:** Размер стилизованных элементов масштабируется через `font-size` родительского контейнера.

### 4. Таблицы

#### Из `table.html`:
```html
<table class="zebra">
    <thead>
        <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Статус</th>
            <th class="align-center">Действия</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>1</td>
            <td class="bold">Элемент 1</td>
            <td><span class="badge green">Активен</span></td>
            <td class="align-center">
                <a href="#" class="inline-link"><i class="wa-icon wa-icon-edit"></i></a>
                <a href="#" class="inline-link"><i class="wa-icon wa-icon-trash"></i></a>
            </td>
        </tr>
    </tbody>
</table>
```

### 5. Карточки и контейнеры

#### Из `card.html`:
```html
<!-- Простая карточка -->
<div class="box">
    <h3>Заголовок карточки</h3>
    <p>Содержимое карточки</p>
</div>

<!-- Карточка с тенью -->
<div class="box shadowed">
    <div class="box-header">
        <h3>Заголовок</h3>
    </div>
    <div class="box-content">
        Содержимое
    </div>
</div>

<!-- Карточка со статусом -->
<article class="article">
    <header>
        <h3>Заголовок статьи</h3>
    </header>
    <div class="article-body">
        Содержимое статьи
    </div>
</article>
```

### 6. Уведомления и алерты

#### Из `alert.html`:
```html
<!-- Информационное уведомление -->
<div class="alert info">
    <span class="icon"><img src="{$wa_url}wa-content/img/icons/info.svg" alt=""></span>
    Информационное сообщение
</div>

<!-- Успешное уведомление -->
<div class="alert success">
    <span class="icon"><img src="{$wa_url}wa-content/img/icons/check.svg" alt=""></span>
    Операция выполнена успешно
</div>

<!-- Предупреждение -->
<div class="alert warning">
    <span class="icon"><img src="{$wa_url}wa-content/img/icons/warning.svg" alt=""></span>
    Внимание! Важная информация
</div>

<!-- Ошибка -->
<div class="alert danger">
    <span class="icon"><img src="{$wa_url}wa-content/img/icons/close.svg" alt=""></span>
    Произошла ошибка
</div>
```

### 7. Модальные окна

#### Из `dialog.html`:
```html
<div class="dialog" id="my-dialog">
    <div class="dialog-background"></div>
    <div class="dialog-body">
        <a href="#" class="dialog-close js-close-dialog" aria-label="Close">&times;</a>
        <header class="dialog-header">
            <h1>Заголовок окна</h1>
        </header>
        <div class="dialog-content">
            Содержимое модального окна
        </div>
        <footer class="dialog-footer">
            <button type="button" class="button blue">Сохранить</button>
            <button type="button" class="button light-gray js-close-dialog">Отмена</button>
        </footer>
    </div>
</div>
```

**Важно (UI 2.0):** подключите UI-хелперы (`{include file="ui_wrapper.html"}` или `<script src="{$wa_url}wa-apps/ui/js/dialog.js"></script>`) и используйте `$.wa_ui.dialog.create`:
```javascript
const dlg = $.wa_ui.dialog.create({
    html: dialog_html,
    onOpen: function($dialog, dialog) {
        // инициализация
    }
});
// Закрыть программно:
dlg.close();
```

### 8. Индикаторы загрузки

#### Из `spinner.html` и `loading.html`:
```html
<!-- Спиннер -->
<span class="spinner wa-animation-spin"></span>

<!-- Блок загрузки -->
<div class="block loading">
    <span class="spinner wa-animation-spin"></span>
    <span>Загрузка...</span>
</div>

<!-- Прогресс-бар -->
<div class="progressbar">
    <div class="progressbar-inner" style="width: 60%"></div>
</div>

<!-- Скелетон -->
<div class="skeleton">
    <div class="skeleton-line"></div>
    <div class="skeleton-line"></div>
    <div class="skeleton-line w50"></div>
</div>
```

### 9. Вкладки

#### Из `tabs.html`:
```html
<ul class="tabs">
    <li class="selected">
        <a href="#tab1">Вкладка 1</a>
    </li>
    <li>
        <a href="#tab2">Вкладка 2</a>
    </li>
    <li>
        <a href="#tab3">Вкладка 3</a>
    </li>
</ul>

<div class="tab-content" id="tab1">
    Содержимое вкладки 1
</div>
```

### 10. Выпадающие списки

#### Из `dropdown.html`:
```html
<div class="dropdown">
    <button class="dropdown-toggle button light-gray">
        Опции ▼
    </button>
    <div class="dropdown-body">
        <ul class="menu">
            <li><a href="#">Опция 1</a></li>
            <li><a href="#">Опция 2</a></li>
            <li class="divider"></li>
            <li><a href="#">Опция 3</a></li>
        </ul>
    </div>
</div>
```

## Полный список компонентов UI

### Базовые компоненты (`wa-apps/ui/templates/actions/component/`):
- **alert.html** - Уведомления и алерты
- **badge.html** - Бейджи и метки
- **button.html** - Все виды кнопок
- **card.html** - Карточки контента
- **dialog.html** - Модальные окна
- **drawer.html** - Выдвижные панели
- **dropdown.html** - Выпадающие меню
- **inputs.html** - Поля ввода
- **table.html** - Таблицы данных
- **tabs.html** - Вкладки
- **toggle.html** / **switch.html** - Переключатели
- **tooltip.html** - Всплывающие подсказки
- **spinner.html** / **loading.html** - Индикаторы загрузки
- **progressbar.html** - Прогресс-бары
- **breadcrumbs.html** - Хлебные крошки
- **sidebar.html** - Боковые панели
- **bricks.html** - Сетка кирпичиков
- **autocomplete.html** - Автодополнение
- **chips.html** - Чипсы/теги
- **skeleton.html** - Скелетоны загрузки

## Тёмный режим (wa-2.0.css)

- Работает из коробки через `@media (prefers-color-scheme: dark)` — без JS-переключателей.
- Используйте только CSS-переменные wa-2.0 (`var(--text-color-...)`, `var(--background-color-...)`, `var(--accent-color)` и т.д.).
- Не хардкодьте цвета (ни в CSS, ни инлайном); если нужен кастом, вводите переменную и переопределяйте её для тёмной темы.
- Проверяйте фон/текстовые контрасты: фон (`--background-color`), поверхности (`--background-color-blank`), границы (`--border-color`), текст (`--text-color`, `--text-color-strong`).
- При необходимости ручного переключения используйте тот же набор переменных — не дублируйте значения.

## CSS-переменные (ОБЯЗАТЕЛЬНЫ к использованию)

### Основные цвета:
```css
/* ВСЕГДА используйте переменные вместо хардкода */
var(--accent-color)                  /* #1a9afe - основной акцент */
var(--blue)                          /* Синий */
var(--red)                           /* #ed2509 - красный */
var(--green)                         /* #22d13d - зеленый */
var(--yellow)                        /* #f3c200 - желтый */
var(--orange)                        /* #ff6c00 - оранжевый */

/* Текст */
var(--text-color)                    /* #444 - основной текст */
var(--text-color-strong)             /* #333 - усиленный */
var(--text-color-hint)               /* #aab - подсказки */
var(--text-color-link)               /* Ссылки */

/* Фоны */
var(--background-color)              /* #f3f5fa - основной фон */
var(--background-color-blank)        /* #fff - белый фон */
var(--background-color-input)        /* Фон полей ввода */

/* Границы */
var(--border-color)                  /* Основной цвет границ */
var(--border-color-input)            /* Границы полей ввода */
```

### Размеры и отступы:
```css
/* Отступы */
var(--inline-margin)                 /* 4px */
var(--block-margin)                  /* 8px */
var(--box-margin)                    /* 16px */

/* Радиусы */
var(--border-radius)                 /* 3px */
var(--border-radius-large)           /* 6px */

/* Тени */
var(--box-shadow)                    /* Стандартная тень */
var(--box-shadow-large)              /* Большая тень */
```

## Утилитарные CSS-классы

### Текст:
```css
/* Цвета текста */
.text-gray       /* Серый текст */
.text-blue       /* Синий текст */
.text-red        /* Красный текст */
.text-green      /* Зеленый текст */
.text-yellow     /* Жёлтый текст */
.text-orange     /* Оранжевый текст */
.text-purple     /* Фиолетовый текст */
.text-brown      /* Коричневый текст */
.text-pink       /* Розовый текст */

/* Насыщенность текста */
.text-strong     /* Более контрастный */
.text-stronger   /* Ещё контрастнее */
.text-strongest  /* Максимальный контраст */

/* Начертание */
.bold            /* Жирный текст (font-weight: bold) */
.semibold        /* Полужирный (font-weight: 500) */
.italic          /* Курсив */
.underline       /* Подчёркивание */
.strike          /* Зачёркнутый */
.black           /* Контрастное выделение */
.link            /* Стиль ссылки */
.gray            /* Серый вспомогательный текст */
.hint            /* Маленькая подсказка серого цвета */

/* Горизонтальное выравнивание */
.align-left          /* text-align: left */
.align-left-mobile   /* Только на мобильных */
.align-center        /* text-align: center */
.align-center-mobile /* Только на мобильных */
.align-right         /* text-align: right */
.align-right-mobile  /* Только на мобильных */

/* Вертикальное выравнивание */
.valign-top      /* vertical-align: top */
.valign-middle   /* vertical-align: middle */
.valign-bottom   /* vertical-align: bottom */

/* Переносы и обрезка */
.nowrap          /* Без переноса (white-space: nowrap) */
.break-all       /* Разбиение в любом месте (word-break: break-all) */
.break-word      /* Разбиение по словам (word-break: break-word) */
.text-ellipsis   /* Обрезка многоточием */

/* Регистр */
.uppercase       /* ВЕРХНИЙ РЕГИСТР */
.lowercase       /* нижний регистр */
.capitalize      /* Каждое Слово С Заглавной */
```

### Размеры текста:
```css
.smallest        /* 50% от базового размера */
.smaller         /* 75% */
.small           /* 87.5% */
.large           /* 125% */
.larger          /* 150% */
.largest         /* 200% */
```

**Примечание:** Эти классы предназначены для текста (`span`, `p`, `a`, `b`, `i`) и атомарных элементов (`input`, `button`). Для навигационных блоков (`.sidebar`, `.menu`, `.tabs`) не применяйте.

### Ширина (.width-*):
```css
.width-0         /* 0% */
.width-10        /* 10% */
.width-20        /* 20% */
.width-25        /* 25% */
.width-30        /* 30% */
.width-33        /* 33% */
.width-40        /* 40% */
.width-50        /* 50% */
.width-60        /* 60% */
.width-66        /* 66% */
.width-70        /* 70% */
.width-80        /* 80% */
.width-90        /* 90% */
.width-100       /* 100% */
.width-auto      /* auto */
```

### Отступы:
```css
.margin          /* Отступ 16px */
.margin-block    /* Вертикальный отступ */
.margin-inline   /* Горизонтальный отступ */
.no-margin       /* Убрать отступы */

.padded          /* Внутренний отступ */
.rounded         /* Скругленные углы */
.shadowed        /* Тень */
```

### Flexbox:
```css
.flexbox         /* display: flex */
.middle          /* align-items: center */
.space-between   /* justify-content: space-between */
```

**Расширенные модификаторы .flexbox:**

```html
<!-- Элемент занимает всё доступное пространство -->
<div class="flexbox full-width">
    <div class="wide">Занимает всё место</div>
    <div>Кнопка</div>
</div>

<!-- Отступы между элементами -->
<div class="flexbox space-16">
    <div>Элемент 1</div>
    <div>Элемент 2</div>
</div>

<!-- Равномерное заполнение -->
<div class="flexbox fixed">
    <div>Равная ширина</div>
    <div>Равная ширина</div>
</div>

<!-- Вертикальное расположение -->
<div class="flexbox vertical">
    <div>Сверху</div>
    <div>Снизу</div>
</div>

<!-- Перенос элементов -->
<div class="flexbox wrap">
    <div>Элемент</div>
    <div>Элемент</div>
    <div>Элемент</div>
</div>
```

```css
/* Модификаторы контейнера */
.flexbox.full-width       /* Занять всю доступную ширину */
.flexbox.fixed            /* Равномерное заполнение ячеек */
.flexbox.vertical         /* flex-direction: column */
.flexbox.vertical-mobile  /* Вертикально только на мобильных (≤760px) */
.flexbox.wrap             /* flex-wrap: wrap */
.flexbox.wrap-mobile      /* Перенос только на мобильных */
.flexbox.space-XX         /* Отступы между элементами (0, 4, 8, 12, 16, 20, 24, 32, 40, 48) */

/* Модификаторы дочерних элементов */
.flexbox > .wide          /* flex: 1 — занять всё доступное пространство */
.flexbox > .middle        /* Вертикальное центрирование отдельного элемента */
```

### .inlinebox — Inline-block контейнер

Простая альтернатива `.flexbox` для вывода элементов в горизонтальный ряд через `display: inline-block`.

```html
<div class="inlinebox space-16">
    <div>Элемент 1</div>
    <div>Элемент 2</div>
    <div>Элемент 3</div>
</div>

<!-- С ul/li -->
<ul class="inlinebox baseline space-20">
    <li>Пункт 1</li>
    <li>Пункт 2</li>
    <li>Пункт 3</li>
</ul>
```

**Модификаторы:**
```css
.inlinebox.baseline   /* vertical-align: baseline */
.inlinebox.middle     /* vertical-align: middle */
.inlinebox.space-XX   /* Отступы между элементами (0, 4, 8, 12, 16, 20, 24, 32, 40, 48) */
```

### .tablebox — CSS-табличная вёрстка

Контейнер на основе `display: table`. Главное преимущество — **жёсткая фиксация ширины колонок** независимо от контента внутри (в отличие от flexbox).

```html
<!-- Базовый tablebox -->
<div class="tablebox">
    <div>Колонка 1</div>
    <div>Колонка 2</div>
    <div>Колонка 3</div>
</div>

<!-- Фиксированные равные колонки -->
<div class="tablebox fixed">
    <div>Равная колонка</div>
    <div>Равная колонка</div>
    <div>Равная колонка</div>
</div>

<!-- Скелет sidebar + content -->
<div class="tablebox fixed space-16">
    <div style="width: 33%;">
        <aside>Сайдбар</aside>
    </div>
    <div>
        <main>Контент</main>
    </div>
</div>
```

**Модификаторы:**
```css
.tablebox.fixed      /* Равномерное распределение ширины колонок */
.tablebox.middle     /* Вертикальное центрирование всех колонок */
.tablebox.space-XX   /* Отступы между колонками (0, 4, 8, 12, 16, 20, 24, 32, 40, 48) */
```

**Примечание:** У колонок `.tablebox` не работает `position: relative/absolute`. При необходимости используйте дополнительную обёртку внутри колонки.

## Примеры использования в Smarty

### Создание формы с правильными классами:
```smarty
<form method="post" action="">
    <div class="fields">
        <div class="field">
            <div class="name">{_w('Name')}</div>
            <div class="value">
                <input type="text" name="name" value="{$name|escape}" class="bold">
            </div>
        </div>
        
        <div class="field">
            <div class="name">{_w('Status')}</div>
            <div class="value">
                <span class="switch" id="status-switch">
                    <input type="checkbox" name="status" {if $status}checked{/if}>
                </span>
            </div>
        </div>
    </div>
    
    <div class="field">
        <div class="value submit">
            <button type="submit" class="button green">{_w('Save')}</button>
            <button type="button" class="button light-gray js-cancel">{_w('Cancel')}</button>
        </div>
    </div>
</form>

<script>
    $("#status-switch").waSwitch();
</script>
```

## JavaScript API компонентов

Для работы всех JS-компонентов требуется подключение `wa-content/js/jquery-wa/wa.js`.

### $.wa_ui.title.set() — Управление заголовком страницы

Динамическое изменение заголовка страницы (в title и вкладке браузера).

```javascript
// Установить заголовок
$.wa_ui.title.set("Новый заголовок страницы");

// В Smarty (в конце шаблона)
<script>
    $.wa_ui.title.set({$_title|json_encode});
</script>
```

### $.waDialog() — Модальные окна

```javascript
$.waDialog({
    html: dialog_html,                    // HTML-код диалога
    // или
    $wrapper: $existing_dialog,           // jQuery-объект существующего диалога
    // или по частям:
    header: '<h1>Заголовок</h1>',
    content: '<p>Содержимое</p>',
    footer: '<button class="button blue">OK</button>',
    
    // Опции
    position: { left: 100, top: 100 },    // Фиксированная позиция (опционально)
    options: { custom_data: 'value' },    // Данные для передачи в диалог
    
    // Callbacks
    onOpen: function($dialog, dialog_instance) {
        // Вызывается при открытии
    },
    onClose: function(dialog_instance) {
        return true; // return false чтобы отменить закрытие
    },
    onBgClick: function(event) {
        // Клик по фону
    },
    onResize: function($dialog, dialog_instance) {
        // При изменении размера окна
    }
});

// Методы экземпляра
var dialog = $(".dialog").data("dialog");
dialog.close();    // Закрыть и удалить
dialog.hide();     // Скрыть (можно показать снова)
dialog.show();     // Показать скрытый диалог
dialog.resize();   // Пересчитать позицию
```

### $.waDrawer() — Выдвижные панели

«Шторка», выезжающая из-за границы экрана. Рекомендуется для быстрых действий с возвратом к контексту.

```javascript
$.waDrawer({
    html: drawer_html,                    // HTML-код шторки
    // или
    $wrapper: $existing_drawer,           // jQuery-объект
    // или по частям:
    header: '<h1>Заголовок</h1>',
    content: '<p>Содержимое</p>',
    footer: '<button>Закрыть</button>',
    
    // Опции
    direction: "right",                   // "left" или "right" (по умолчанию "right")
    width: "600px",                       // Ширина шторки
    esc: true,                            // Закрытие по Esc (по умолчанию true)
    lock_body_scroll: true,               // Блокировка прокрутки страницы
    options: { custom_data: 'value' },    // Данные для передачи
    
    // Callbacks
    onOpen: function($drawer, drawer_instance) { },
    onClose: function(drawer_instance) {
        return true; // return false чтобы отменить закрытие
    },
    onBgClick: function(event, $drawer, drawer_instance) { }
});

// Методы экземпляра
var drawer = $(".drawer").data("drawer");
drawer.close();    // Закрыть и удалить
drawer.hide();     // Скрыть (переносит в Virtual DOM)
drawer.show();     // Показать скрытый drawer
```

**HTML-структура drawer:**
```html
<div class="drawer">
    <div class="drawer-background"></div>
    <div class="drawer-body">
        <a href="#" class="drawer-close js-close-drawer"><i class="wa-icon wa-icon-times"></i></a>
        <div class="drawer-block">
            <header class="drawer-header"><h1>Заголовок</h1></header>
            <div class="drawer-content">Содержимое</div>
            <footer class="drawer-footer">
                <button class="js-close-drawer button light-gray">Закрыть</button>
            </footer>
        </div>
    </div>
</div>
```

### $.fn.waDropdown() — Выпадающие меню

Готовый плагин для структур из `dropdown.html` (`.dropdown` > `.dropdown-toggle` + `.dropdown-body`).

```javascript
// Базово
$(".dropdown").waDropdown();

// С выбором пункта
$(".dropdown").waDropdown({
    change_selector: ".menu a", // Что выбирать внутри .dropdown-body
    change_class: "selected",   // Класс активного пункта (default: selected)
    change_title: true,         // Подменять текст кнопки
    change_hide: true,          // Закрывать меню после выбора
    hover: true                 // Открытие по hover (по умолчанию true)
});
```

**События:** `open`, `close`, `change` на корневом `.dropdown`.<br>
**Экземпляр:** `var dd = $(".dropdown").waDropdown("dropdown");`.<br>
**Важно:** кнопка — `.dropdown-toggle`, меню — `.dropdown-body`.

### $.waUpload() — Загрузка файлов

```javascript
// Простая загрузка по клику
$("#file-upload").waUpload({
    show_file_name: true      // Показывать имя загруженного файла
});

// Drag-n-drop загрузка
$("#drop-area").waUpload({
    is_uploadbox: true,       // Включить drag-n-drop режим
    show_file_name: true
});
```

**HTML-структура:**
```html
<!-- Простая загрузка -->
<div id="file-upload">
    <div class="upload">
        <label class="link">
            <i class="wa-icon wa-icon-file-upload"></i>
            <span>Выберите файл</span>
            <input name="file" type="file" autocomplete="off">
        </label>
    </div>
</div>

<!-- Drag-n-drop (добавляется класс .uploadbox автоматически) -->
<div id="drop-area">
    <div class="upload">
        <label class="link">
            <i class="wa-icon wa-icon-file-upload"></i>
            <span>Выберите файл</span>
            <input name="files" type="file" multiple autocomplete="off">
        </label>
    </div>
</div>
```

### $.waAutocomplete() — Автодополнение

Основан на jQuery UI Autocomplete.

```javascript
$("#search-input").waAutocomplete({
    source: ["вариант1", "вариант2", "вариант3"],  // Массив или URL
    // Все опции jQuery UI Autocomplete поддерживаются
    minLength: 2,
    delay: 300,
    select: function(event, ui) {
        console.log("Выбрано:", ui.item.value);
    }
});
```

### $.waTooltip() — Всплывающие подсказки

**Важно:** Используйте именно `$.waTooltip()` на основе Tippy.js. Старый компонент `.tooltip` (CSS-only) является экспериментальным и **не рекомендуется** к использованию.

Компонент на основе [Tippy.js](https://atomiks.github.io/tippyjs/) для отображения всплывающих подсказок.

```javascript
// Базовое использование
$(".tooltip-trigger").waTooltip({
    placement: "bottom",      // top, bottom, left, right, auto
    class: "badge user blue", // Дополнительные классы
    content: "Текст подсказки"
});

// Расширенные опции
$("#my-tooltip").waTooltip({
    placement: "top",
    trigger: "mouseenter focus",  // или "click"
    allowHTML: true,              // Разрешить HTML в содержимом
    delay: 100,                   // Задержка показа/скрытия (мс)
    maxWidth: 350,                // Максимальная ширина
    
    // Callbacks
    onShow: function(tooltip_instance) {
        console.log("Подсказка показана");
    },
    onHide: function(tooltip_instance) {
        console.log("Подсказка скрыта");
    }
});
```

**HTML с data-атрибутами:**
```html
<!-- Простой tooltip -->
<span class="wa-tooltip" data-wa-tooltip-content="Текст подсказки">
    <i class="wa-icon wa-icon-question-circle"></i>
</span>

<!-- С позиционированием -->
<span class="wa-tooltip" 
      data-wa-tooltip-content="Подсказка слева" 
      data-wa-tooltip-placement="left">
    <i class="wa-icon wa-icon-info-circle"></i>
</span>

<!-- По клику -->
<span class="wa-tooltip" 
      data-wa-tooltip-content="Показывается по клику" 
      data-wa-tooltip-trigger="click">
    Кликни меня
</span>

<!-- С HTML-шаблоном -->
<span class="wa-tooltip" data-wa-tooltip-template="#my-template">
    <i class="wa-icon wa-icon-question-circle"></i>
</span>
<div class="wa-tooltip-template" id="my-template">
    <p><strong>Заголовок</strong></p>
    <p>Параграф с <em>HTML</em> форматированием.</p>
</div>

<script>
    $(".wa-tooltip").waTooltip();
</script>
```

### $.waToggle() — Переключатель режима

Переключатель для выбора режима, вида, фильтра. Используйте для действий в рамках текущей страницы.

```javascript
$("#my-toggle").waToggle({
    change: function(event, target, toggle) {
        var selectedValue = $(target).data('value');
        console.log("Выбрано:", selectedValue);
    }
});
```

**HTML-структура:**
```html
<div class="toggle" id="my-toggle">
    <span data-value="all">Все</span>
    <span data-value="active" class="selected">Активные</span>
    <span data-value="archived">Архив</span>
</div>
```

**Модификаторы размера:** `.small`, `.smaller`, `.smallest`, `.large`, `.larger`, `.largest`

**Модификаторы стиля:**
```html
<div class="toggle rounded">...</div>      <!-- Скруглённые края -->
<div class="toggle small rounded">...</div> <!-- Маленький скруглённый -->
```

### $.waSlider() — Слайдер диапазонов

Компонент для выбора диапазона значений (фильтры по цене, дате и т.д.).

```javascript
$("#price-slider").waSlider({
    $input_min: $("#price-min"),      // Поле минимума
    $input_max: $("#price-max"),      // Поле максимума
    hide: { min: false, max: false }, // Скрыть ползунки
    limit: { min: 0, max: 10000 },    // Границы
    values: { min: 100, max: 5000 },  // Начальные значения
    
    // События
    move: function(values, slider) {
        console.log("Движение:", values);  // [min, max]
    },
    change: function(values, slider) {
        console.log("Изменение:", values); // После отпускания
    }
});
```

**HTML-структура:**
```html
<div class="slider" id="price-slider">
    <input type="text" id="price-min" value="100">
    <input type="text" id="price-max" value="5000">
</div>
```

**API методы:**
```javascript
var slider = $("#price-slider").data("slider");

// Получить значение по проценту (0-1)
slider.getValue(0.5);       // Возвращает значение в середине диапазона

// Получить процент по значению
slider.getOffset(2500);     // Возвращает процент (0-1)

// Установить значения
slider.setValues([500, 3000]);
```

**События:**
```javascript
$("#price-slider").on("move", function(event, values, slider) {
    // При движении ползунка
});

$("#price-slider").on("slider_change", function(event, values, slider) {
    // После отпускания ползунка
});
```

### $.waProgressbar() — Прогресс-бары

Индикатор выполнения процесса. Поддерживает линейный и круговой режимы.

```javascript
// Линейный прогресс-бар
$("#my-progressbar").waProgressbar({
    percentage: 25,
    color: "#1a9afe",           // Цвет заливки
    "stroke-width": 5,          // Толщина линии
    "display-text": true,       // Показывать процент
    "text-inside": false        // Текст внутри/снаружи
});

// Круговой прогресс-бар
$("#circle-progressbar").waProgressbar({
    type: "circle",             // Круговой режим
    percentage: 75,
    "stroke-width": 4.8
});

// Управление
var progressbar = $("#my-progressbar").data("progressbar");
progressbar.set({ 
    percentage: 50, 
    text: "50% загружено" 
});
```

**Статическая версия (без JS):**
```html
<!-- Линейный -->
<div class="progressbar">
    <div class="progressbar-line-wrapper text-outside">
        <div class="progressbar-outer">
            <div class="progressbar-inner" style="width: 45%;"></div>
        </div>
        <div class="progressbar-text">45%</div>
    </div>
</div>

<!-- С текстом внутри -->
<div class="progressbar">
    <div class="progressbar-line-wrapper text-inside">
        <div class="progressbar-outer">
            <div class="progressbar-inner" style="width: 70%;">
                <div class="progressbar-text">70%</div>
            </div>
        </div>
    </div>
</div>

<!-- Нативный progress с цветами -->
<progress max="100" value="70"></progress>
<progress max="100" value="35" class="color-green"></progress>
<progress max="100" value="75" class="color-orange"></progress>
```

## Скелетоны загрузки

Компонент `.skeleton` для отображения placeholder'ов во время загрузки данных.

### Базовые элементы скелетона:

```html
<div class="skeleton">
    <!-- Заголовок (h1, h2) -->
    <span class="skeleton-header"></span>
    <span class="skeleton-header" style="width: 70%;"></span>
    
    <!-- Строка текста -->
    <span class="skeleton-line"></span>
    <span class="skeleton-line" style="width: 60%;"></span>
    
    <!-- Пункт меню с иконкой -->
    <span class="skeleton-list"></span>
    
    <!-- Круг (аватар) -->
    <span class="skeleton-custom-circle size-48"></span>
    <span class="skeleton-custom-circle size-96"></span>
    <span class="skeleton-custom-circle size-144"></span>
    
    <!-- Прямоугольник произвольного размера -->
    <span class="skeleton-custom-box" style="width: 200px; height: 150px;"></span>
</div>
```

### Размеры кругов:
- `.size-48` — 48x48px
- `.size-96` — 96x96px
- `.size-144` — 144x144px
- `.size-192` — 192x192px

### Пример скелетона страницы:

```html
<div class="skeleton">
    <div class="flexbox">
        <!-- Сайдбар -->
        <div class="sidebar blank height-auto">
            <span class="skeleton-custom-circle size-96" style="margin: 0 auto 1rem;"></span>
            <span class="skeleton-line"></span>
            <span class="skeleton-list"></span>
            <span class="skeleton-list"></span>
            <span class="skeleton-list"></span>
        </div>
        
        <!-- Контент -->
        <div class="content">
            <div class="article-body">
                <span class="skeleton-custom-box" style="height: 200px; margin-bottom: 1rem;"></span>
                <span class="skeleton-header" style="width: 70%;"></span>
                <span class="skeleton-line"></span>
                <span class="skeleton-line"></span>
                <span class="skeleton-line" style="width: 60%;"></span>
            </div>
        </div>
    </div>
</div>
```

### Использование с AJAX:

```javascript
// 1. Показать скелетон
$('#content').html(skeleton_html);

// 2. Загрузить данные
$.get("page.php", function(data) {
    // 3. Заменить скелетон на данные
    $('#content').html(data);
});
```

**Smarty-функция для переиспользования:**
```smarty
{function skeleton}
<div class="skeleton">
    {for $i=1 to 3}
    <span class="skeleton-list"></span>
    {/for}
</div>
{/function}

{* Использование *}
<div id="content">
    {skeleton}
</div>
```

## Мобильные компоненты

### .bottombar — Мобильная навигация

Фиксированная навигация в нижней части экрана. Рекомендуется для мобильных устройств (не более 5 пунктов).

```html
<div class="bottombar">
    <ul>
        <li>
            <a href="#">
                <i class="wa-icon wa-icon-list"></i>
                <span>Списки</span>
            </a>
        </li>
        <li class="selected">
            <a href="#">
                <i class="wa-icon wa-icon-check"></i>
                <span>Задачи</span>
            </a>
        </li>
        <li>
            <a href="#">
                <i class="wa-icon wa-icon-heart"></i>
                <span>Избранное</span>
            </a>
        </li>
        <li>
            <a href="#">
                <i class="wa-icon wa-icon-cog"></i>
                <span>Настройки</span>
                <span class="badge">1</span>
            </a>
        </li>
    </ul>
</div>
```

**Важно:** При использовании `.bottombar` вместе с `.sidebar` / `.content`, добавьте класс `.with-bottombar` на `#wa-app` для корректировки высоты.

### Responsive-классы

```css
.mobile-only           /* Только на мобильных */
.tablet-only           /* Только на планшетах */
.desktop-only          /* Только на десктопах */
.desktop-and-tablet-only  /* Десктоп + планшет */
.mobile-and-tablet-only   /* Мобильный + планшет */
```

## Продвинутые компоненты

### .chips — Горизонтальное меню / Теги

Линейное горизонтальное меню для фильтрации, тегов, выбора вида.

```html
<ul class="chips">
    <li class="selected"><a href="#">Все</a></li>
    <li><a href="#"><i class="wa-icon wa-icon-star"></i> Избранное</a></li>
    <li class="accented"><a href="#">Новое <span class="count">5</span></a></li>
    <li><a href="#">Архив</a></li>
</ul>
```

**Модификаторы размера:** `.small`, `.smaller`, `.smallest`, `.large`, `.larger`, `.largest`

**Модификаторы стиля:**
- `.transparent` — прозрачный фон
- `.outlined` — только обводка
- `.rounded` — скруглённые углы

```html
<ul class="chips small outlined rounded">
    <li class="selected"><a href="#">Опция 1</a></li>
    <li><a href="#">Опция 2</a></li>
</ul>
```

**Теги (.tags):**
```html
<ul class="chips tags">
    <li class="selected"><a href="#"><i class="wa-icon wa-icon-hashtag"></i>webasyst</a></li>
    <li><a href="#"><i class="wa-icon wa-icon-hashtag"></i>shop-script</a></li>
    <li><a href="#"><i class="wa-icon wa-icon-hashtag"></i>CRM</a></li>
</ul>
```

### .bricks — Кирпичики для сайдбара

Навигация в виде кирпичиков в две колонки. Идеально для сайдбара.

```html
<div class="bricks">
    <div class="brick selected">
        <span class="icon"><i class="wa-icon wa-icon-star"></i></span>
        <span class="count">495</span>
        Москва
    </div>
    <div class="brick accented">
        <span class="icon"><i class="wa-icon wa-icon-sun"></i></span>
        Сочи
    </div>
    <div class="brick">
        <span class="icon"><i class="wa-icon wa-icon-heart"></i></span>
        <span class="count">New!</span>
        Питер
    </div>
    <a href="#" class="brick full-width">
        <span class="icon"><i class="wa-icon wa-icon-globe"></i></span>
        Все города
    </a>
</div>
```

**Модификаторы:**
- `.selected` — выбранный кирпичик
- `.accented` — акцентированный
- `.full-width` — на всю ширину

### .icon — Контейнер для индивидуальных иконок

Контейнер для вставки собственных иконок (SVG, img, background). Font Awesome иконки оборачивать в `.icon` **не нужно**.

```html
<!-- SVG-иконка -->
<span class="icon">
    <svg>...</svg>
</span>

<!-- Картинка -->
<span class="icon">
    <img src="icon.png" alt="">
</span>

<!-- Фон (цвет или изображение) -->
<span class="icon">
    <i class="rounded" style="background-color: orangered;"></i>
</span>

<span class="icon">
    <i class="rounded bordered" style="background-image: url('...');"></i>
</span>
```

**Размеры (.size-XX):**
```html
<span class="icon size-10">...</span>  <!-- 10px -->
<span class="icon size-12">...</span>  <!-- 12px -->
<span class="icon size-14">...</span>  <!-- 14px -->
<span class="icon size-16">...</span>  <!-- 16px (по умолчанию) -->
<span class="icon size-20">...</span>  <!-- 20px -->
<span class="icon size-24">...</span>  <!-- 24px -->
<span class="icon size-30">...</span>  <!-- 30px -->
```

**Выравнивание:**
```css
.icon.top       /* vertical-align: top */
.icon.baseline  /* vertical-align: baseline */
.icon.middle    /* vertical-align: middle */
.icon.shift-x   /* Смещение вниз на x пикселей относительно baseline */
```

**Модификаторы внутреннего элемента:**
```css
.icon > i.rounded   /* Круглая иконка */
.icon > i.bordered  /* С границей */
.icon > i.userpic   /* Размер 1.25rem (≈20px) для userpic в тексте */
```

**Пример в тексте:**
```html
<p>
    Пользователь 
    <span class="icon"><i class="userpic" style="background-image: url('avatar.jpg');"></i></span>
    выполнил задачу
</p>
```

**Примечание:** Используйте встроенные иконки UI 2.0 (`wa-content/img/icons/*.svg` или классы `wa-icon`) вместо сторонних библиотек. При необходимости оборачивайте их в `.icon` для выравнивания.

### .userpic — Аватары пользователей

```html
<!-- Базовые размеры -->
<img class="userpic userpic-20" src="..." />   <!-- 20x20px -->
<img class="userpic userpic-32" src="..." />   <!-- 32x32px -->
<img class="userpic userpic-48" src="..." />   <!-- 48x48px -->
<img class="userpic userpic-96" src="..." />   <!-- 96x96px -->
<img class="userpic userpic-144" src="..." />  <!-- 144x144px -->
<img class="userpic userpic-192" src="..." />  <!-- 192x192px -->

<!-- С background-image -->
<span class="userpic userpic-48" style="background-image: url('...');"></span>

<!-- Со статусом -->
<span class="userpic userpic-48">
    <img src="..." alt="">
    <span class="userstatus"></span>  <!-- Зелёный индикатор -->
</span>

<!-- Статус с иконкой -->
<span class="userpic userpic-48">
    <img src="..." alt="">
    <span class="userstatus"><i class="wa-icon wa-icon-umbrella-beach"></i></span>
</span>

<!-- С обводкой -->
<span class="userpic userpic-48 outlined">
    <img src="..." alt="">
    <span class="userstatus bg-blue"><i class="wa-icon wa-icon-check"></i></span>
</span>
```

**Цвета статуса:** `.bg-blue`, `.bg-green`, `.bg-red`, `.bg-purple`, `.bg-brown`

**Как иконка в тексте:**
```html
<p>
    Пользователь 
    <span class="icon userpic" style="background-image: url('...');"></span>
    выполнил задачу
</p>
```

## Чек-лист для разработчика

При создании интерфейса проверьте:

- [ ] Подключен `wa-2.0.css`
- [ ] Используются компоненты из `wa-apps/ui/`
- [ ] Применяются стандартные классы (не кастомные)
- [ ] Цвета заданы через CSS-переменные
- [ ] Отступы используют стандартные классы
- [ ] Формы следуют структуре `.field > .name + .value`
- [ ] Кнопки используют классы `.button` + модификаторы цвета
- [ ] Таблицы имеют класс `.zebra` для полосатости
- [ ] Модальные окна следуют структуре `.dialog`
- [ ] Иконки используют Font Awesome классы

## Чего НЕ делать

- **НЕ создавайте кастомные стили для стандартных элементов**
- **НЕ хардкодьте цвета - используйте переменные**
- **НЕ изобретайте свою структуру - используйте готовые компоненты**
- **НЕ игнорируйте примеры из приложения UI**
- **НЕ смешивайте старые стили с UI 2.0**

## Навигация и структура

### .menu — Навигационное меню

Меню навигации для сайдбара или выпадающих списков. Поддерживает иконки, счётчики, вложенность.

#### Базовая структура:
```html
<ul class="menu">
    <li class="selected">
        <a href="#">
            <i class="wa-icon wa-icon-home"></i>
            <span>Главная</span>
        </a>
    </li>
    <li>
        <a href="#">
            <span class="count">5</span>
            <i class="wa-icon wa-icon-folder"></i>
            <span>Документы <span class="hint">подсказка</span></span>
        </a>
    </li>
    <li class="accented">
        <a href="#">
            <span class="count"><span class="badge">3</span></span>
            <i class="wa-icon wa-icon-bell"></i>
            <span>Уведомления</span>
        </a>
    </li>
</ul>
```

#### Модификаторы для `.menu`:
```css
.menu.ellipsis       /* Обрезка длинных названий многоточием */
.menu.break-words    /* Разбиение длинных слов */
.menu.large          /* Увеличенный размер элементов */
.menu.mobile-friendly /* Удобнее для мобильных (крупнее) */
```

#### Модификаторы для `li`:
```css
li.selected          /* Выбранный пункт */
li.accented          /* Акцентированный пункт */
li.rounded           /* Скруглённые края */
li.top-padded        /* Отступ сверху */
li.bottom-padded     /* Отступ снизу */
li.tag               /* Стиль тега */
```

#### Вложенные меню:
```html
<ul class="menu">
    <li>
        <a href="#"><i class="wa-icon wa-icon-globe"></i><span>Города</span></a>
        <ul class="menu">
            <li><a href="#"><i class="wa-icon wa-icon-folder"></i><span>Москва</span></a></li>
            <li><a href="#"><i class="wa-icon wa-icon-tree"></i><span>Сочи</span></a></li>
        </ul>
    </li>
</ul>
```

### .heading — Заголовки секций

Заголовок над меню или секцией внутри `.fields`.

```html
<!-- Простой заголовок -->
<h5 class="heading">Города</h5>

<!-- Выделенный заголовок -->
<h5 class="heading black">Проект "Отпуск"</h5>

<!-- С счётчиком и действием -->
<h5 class="heading">
    <span>Списки</span>
    <span class="count">3</span>
    <a href="#" class="count action"><i class="wa-icon wa-icon-plus-circle"></i></a>
</h5>

<!-- Со сворачивалкой -->
<div class="heading">
    <span>
        <span class="caret"><i class="wa-icon wa-icon-caret-down"></i></span>
        Заголовок секции
    </span>
    <a href="#" class="count action"><i class="wa-icon wa-icon-cog"></i></a>
</div>
```

### .sidebar — Расширенные модификаторы

#### Режимы работы:
```css
.sidebar.rail                  /* Узкий режим (4rem), только иконки */
.sidebar.scrolls-with-content  /* Прокрутка вместе с контентом */
.sidebar.overflow-visible      /* Для тултипов и дропдаунов */
```

#### Управление шириной:
```css
.sidebar.width-10rem           /* Ширина 10rem */
.sidebar.width-15rem           /* Ширина 15rem */
.sidebar.width-20rem           /* Ширина 20rem */
/* ... от 10 до 26rem */
.sidebar.width-auto            /* Автоматическая ширина */
.sidebar.width-adaptive        /* Адаптивная: 13rem/12rem/15rem */
.sidebar.width-adaptive-wider  /* Адаптивная шире: 16rem/14rem/19rem */
.sidebar.width-adaptive-widest /* Адаптивная самая широкая */
```

#### Другие модификаторы:
```css
.sidebar.right                 /* Справа от контента */
.sidebar.height-auto           /* Высота по содержимому */
.sidebar.blank                 /* Белый фон */
.sidebar.mobile-friendly       /* Скрывается на мобильных */
```

#### Структура с header/footer:
```html
<div class="sidebar flexbox">
    <div class="sidebar-header">Кнопка действия</div>
    <div class="sidebar-body">Прокручиваемый контент</div>
    <div class="sidebar-footer">Подвал</div>
</div>
```

#### Режим .rail (только иконки):
```html
<div class="sidebar rail">
    <ul class="menu">
        <li class="selected"><a href="#"><i class="wa-icon wa-icon-star"></i></a></li>
        <li><a href="#"><i class="wa-icon wa-icon-folder"></i></a></li>
        <li><a href="#"><i class="wa-icon wa-icon-cog"></i></a></li>
    </ul>
</div>
```

### .paging — Пагинация

```html
<ul class="paging">
    <li><a href="#">←</a></li>
    <li><a href="#">1</a></li>
    <li><a href="#">2</a></li>
    <li class="selected"><a href="#">3</a></li>
    <li><a href="#">4</a></li>
    <li><span>...</span></li>
    <li><a href="#">21</a></li>
    <li><a href="#">→</a></li>
</ul>
```

**Рекомендация:** В интерфейсах Webasyst предпочтительнее использовать lazy loading (автоподгрузку). Пагинацию используйте, если автоподгрузка не подходит.

## Дополнительные компоненты

### $.waSlider() — Слайдер диапазонов

Компонент для выбора диапазона значений (фильтры по цене, дате и т.д.).

```html
<div class="slider" id="price-slider">
    <input type="text" id="price-min" value="100">
    <input type="text" id="price-max" value="500">
</div>
```

```javascript
$("#price-slider").waSlider({
    $input_min: $("#price-min"),      // Поле минимума
    $input_max: $("#price-max"),      // Поле максимума
    hide: { min: false, max: false }, // Скрыть ползунки
    limit: { min: 0, max: 1000 },     // Границы
    values: { min: 100, max: 500 },   // Начальные значения
    
    // События
    move: function(values, slider) {
        console.log("Движение:", values);
    },
    change: function(values, slider) {
        console.log("Изменение:", values);
    }
});

// API
var slider = $("#price-slider").data("slider");
slider.getValue(0.5);       // Значение по проценту (0-1)
slider.getOffset(250);      // Процент по значению
slider.setValues([100, 300]); // Установить значения
```

### .banner — Критические уведомления

Для критических сообщений, блокирующих работу. **Используйте только в исключительных случаях!**

```html
<!-- Фиксированный баннер (над приложением) -->
<div class="banner">
    Критическая ошибка! Требуется действие.
    <a href="#" class="banner-close"><i class="wa-icon wa-icon-times"></i></a>
</div>

<!-- Статичный баннер (в потоке контента) -->
<div class="banner static">
    Важное сообщение
</div>
```

**Важно:** Для обычных уведомлений используйте `.alert`, а не `.banner`.

### .pulsar — Пульсирующая анимация

Привлечение внимания к важному элементу пульсацией.

```html
<button class="circle pulsar">
    <i class="wa-icon wa-icon-plus"></i>
</button>

<a href="#" class="button blue pulsar">Начать</a>
```

**Рекомендация:** Не используйте более одного пульсара на странице.

### .thumbs — Плиточное представление

Для отображения изображений, файлов, карточек плиткой.

```html
<ul class="thumbs">
    <li>
        <a href="#"><img src="photo.jpg"></a>
        <label class="bold black">
            <input type="checkbox"> IMG_001
        </label>
        <div class="hint">Вчера 18:41</div>
    </li>
</ul>
```

#### Фиксированные размеры:
```css
.thumbs.li50px   /* 50px */
.thumbs.li100px  /* 100px */
.thumbs.li150px  /* 150px */
.thumbs.li200px  /* 200px */
.thumbs.li250px  /* 250px */
.thumbs.li300px  /* 300px */
.thumbs.li350px  /* 350px */
```

#### Модификаторы для `li`:
```css
li.selected      /* Выбранный элемент */
li.shadowed      /* С тенью */
li.highlighted   /* Подсвеченный */
```

```html
<ul class="thumbs li150px">
    <li class="selected">
        <a href="#"><img src="photo1.jpg"></a>
    </li>
    <li class="highlighted">
        <a href="#"><img src="photo2.jpg"></a>
    </li>
</ul>
```

## Анимации

### Рекомендации по анимациям
- Длительность: **100-200мс** (не более)
- Используйте jQuery: `.slideDown(200)`, `.slideUp()`, `.slideToggle()`
- Избегайте `.show()` / `.hide()` с анимацией
- Не анимируйте `:hover` — подсветка должна быть мгновенной

### Доступные классы:

```html
<!-- Качание (swing) -->
<button class="wa-animation-swing">Кнопка</button>

<!-- Вращение (spin) -->
<i class="wa-icon wa-icon-spinner wa-animation-spin"></i>

<!-- Вращение на 90° (один раз) -->
<i class="wa-icon wa-icon-chevron-down wa-animation-spin rotate90"></i>

<!-- Вращение на 180° (один раз) -->
<i class="wa-icon wa-icon-chevron-down wa-animation-spin rotate180"></i>

<!-- Разная скорость вращения -->
<i class="wa-icon wa-icon-spinner wa-animation-spin speed-1000"></i> <!-- 1 сек -->
<i class="wa-icon wa-icon-spinner wa-animation-spin speed-1500"></i> <!-- 1.5 сек -->
<i class="wa-icon wa-icon-spinner wa-animation-spin speed-2000"></i> <!-- 2 сек -->
```

## Списки — модификаторы

```html
<!-- Увеличенные отступы между пунктами -->
<ul class="separated">
    <li>Длинный текст пункта...</li>
    <li>Ещё один длинный пункт...</li>
</ul>

<!-- Полосатый список -->
<ul class="zebra">
    <li>Пункт 1</li>
    <li>Пункт 2</li>
</ul>

<!-- С разделителями -->
<ul class="bordered">
    <li>Пункт 1</li>
    <li>Пункт 2</li>
</ul>
```

## Custom отступы (.custom-*)

Форсированная корректировка отступов. Используйте, только если стандартные классы не подходят.

### Синтаксис:
`.custom-{свойство}-{значение}` или `.custom-{свойство}-{значение}-mobile`

### Свойства:
```css
m   = margin
mt  = margin-top
mb  = margin-bottom
ml  = margin-left
mr  = margin-right
mx  = margin-left + margin-right
my  = margin-top + margin-bottom

p   = padding
pt  = padding-top
pb  = padding-bottom
pl  = padding-left
pr  = padding-right
px  = padding-left + padding-right
py  = padding-top + padding-bottom
```

### Значения (в пикселях):
`0`, `2`, `4`, `6`, `8`, `10`, `12`, `14`, `16`, `20`, `24`, `32`, `40`, `48`

### Примеры:
```html
<div class="custom-mt-16">Отступ сверху 16px</div>
<div class="custom-pb-24">Внутренний отступ снизу 24px</div>
<div class="custom-mx-auto">Центрирование по горизонтали</div>
<div class="custom-my-8-mobile">Только на мобильных</div>
```

## Расширенные утилитарные классы

### Подсветка текста:
```css
.highlighted             /* Жёлтый маркер */
.highlighted.green       /* Зелёный маркер */
.highlighted.pink        /* Розовый маркер */
.highlighted.blue        /* Синий маркер */
.highlighted.orange      /* Оранжевый маркер */
```

### Состояния:
```css
.state-error             /* Красный текст ошибки */
.state-success           /* Зелёный текст успеха */
.state-caution           /* Жёлтый текст предупреждения */

.state-error-hint        /* Подсказка к ошибке (мелкий шрифт) */
.state-success-hint      /* Подсказка к успеху */
.state-caution-hint      /* Подсказка к предупреждению */
```

### Интерактивность:
```css
.editable                /* Подсветка при :hover */
.cursor-pointer          /* cursor: pointer */
```

### Прозрачность (.opacity-*):
```css
.opacity-0   /* 0% */
.opacity-10  /* 10% */
.opacity-20  /* 20% */
/* ... шаг 10 ... */
.opacity-100 /* 100% */
```

### Z-index (.z-*):
```css
.z-0    /* z-index: 0 */
.z-10   /* z-index: 10 */
.z-20   /* z-index: 20 */
/* ... шаг 10 ... */
.z-100  /* z-index: 100 */
```

**Рекомендация:** Работайте в диапазоне 0-100, чтобы не конфликтовать с системными элементами.

### Ширина (.width-*):
```css
.width-0     /* 0% */
.width-10    /* 10% */
.width-20    /* 20% */
.width-25    /* 25% */
.width-33    /* 33% */
.width-50    /* 50% */
.width-66    /* 66% */
.width-100   /* 100% */
.width-auto  /* auto */
```

### Границы:
```css
.bordered-top     /* Граница сверху */
.bordered-bottom  /* Граница снизу */
.bordered-left    /* Граница слева */
.bordered-right   /* Граница справа */
```

### Фоновые цвета (.bg-*):
```css
.bg-red, .bg-green, .bg-blue, .bg-yellow, .bg-orange
.bg-purple, .bg-brown, .bg-pink, .bg-white, .bg-black
.bg-gray, .bg-light-gray, .bg-dark-gray
```

### Цвета текста (.text-*):
```css
.text-red, .text-green, .text-blue, .text-yellow, .text-orange
.text-purple, .text-brown, .text-pink, .text-white, .text-black
.text-gray, .text-light-gray, .text-dark-gray

/* Усиление контраста */
.text-strong     /* Более контрастный */
.text-stronger   /* Ещё контрастнее */
.text-strongest  /* Максимальный контраст */
```

### Блоки:
```css
.blank                   /* Белый/чёрный фон (зависит от темы) */
.not-blank               /* Приглушённый фон */
.dark-mode-inverted      /* Инверсия в тёмном режиме */
```

## Градиенты

Webasyst 2 использует градиенты для выразительных элементов: кнопок, иконок, баннеров.

### Рекомендации:
- Два цвета, близких на цветовом круге
- Насыщенные, но не ядовитые цвета
- Линейный градиент, наклон 0° или 45°
- Светлый цвет слева или в левом верхнем углу

### Примеры готовых градиентов:
```css
/* Яркие */
background: linear-gradient(90deg, #FF248B 0%, #FF5900 100%);
background: linear-gradient(90deg, #28F500 0%, #88CC00 100%);
background: linear-gradient(90deg, #57C7FF 0%, #668CFF 100%);

/* Средние */
background: linear-gradient(90deg, #0BDF0B 0%, #00994C 100%);
background: linear-gradient(90deg, #05ACFF 0%, #1F57FF 100%);

/* Тёмные */
background: linear-gradient(90deg, #440052 0%, #110029 100%);
background: linear-gradient(90deg, #003652 0%, #00061A 100%);

/* Серые */
background: linear-gradient(90deg, #C4C4C4 0%, #808080 100%);
background: linear-gradient(90deg, #383838 0%, #0F0F0F 100%);
```

## Layout и адаптивность

### CSS Breakpoints:
- **mobile** (телефоны): ≤ 760px
- **tablet** (планшеты): 761px — 1024px
- **desktop** (десктопы): ≥ 1025px

### Классы видимости:
```css
.hidden                    /* Скрыт везде */
.mobile-only               /* Только на телефонах */
.tablet-only               /* Только на планшетах */
.desktop-only              /* Только на десктопах */
.desktop-and-tablet-only   /* Планшеты + десктопы */
.mobile-and-tablet-only    /* Телефоны + планшеты */
```

### Определение устройства на сервере:
```php
// В контроллере
if ($this->getRequest()->isMobile()) {
    $layout = new appMobileLayout();
} else {
    $layout = new appDefaultLayout();
}

// В шаблоне
{if $wa->isMobile()}
    Мобильная версия
{/if}
```

### Разные лейауты:
Рекомендуется создавать `Desktop.html` и `Mobile.html` вместо одного `Default.html` для сложных приложений.

## Тёмный режим

`wa-2.0.css` поддерживает светлый и тёмный режимы через CSS-переменные.

### Автоматическое переключение:
Режим определяется автоматически через `@media (prefers-color-scheme: dark)`.

### Правильное использование цветов:
```css
/* НЕПРАВИЛЬНО */
color: #333;
background: #fff;

/* ПРАВИЛЬНО */
color: var(--text-color);
background: var(--background-color-blank);
```

Все цвета должны использовать CSS-переменные для корректной работы в обоих режимах.

## Дополнительные ресурсы

- Живые примеры: откройте приложение UI в вашем Webasyst
- Исходники компонентов: `wa-apps/ui/templates/actions/component/`
- Основные стили: `wa-content/css/wa/wa-2.0.css`
- JavaScript хелперы: `wa-content/js/jquery-wa/wa.core.js`

---

**ПОМНИТЕ:** Консистентность интерфейса - ключ к хорошему UX. Всегда используйте стандартные компоненты и классы!
