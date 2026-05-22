# GP — единая demo-система (3 приложения)

## Архитектура

| Компонент | Путь |
|-----------|------|
| Общий store | `packages/shared/src/demo/` |
| GP Market (магазины, товары, заказы) | `packages/shared/src/demo/market*.js` |
| Переводы RU/KZ/EN | `packages/shared/src/i18n/` |
| Hub синхронизации (разные порты) | `scripts/demo-store-hub.mjs` → `:5190` |
| Автотест услуг | `npm run demo:test` |
| Автотест магазина | `npm run demo:market:test` |

LocalStorage **не общий** между `:5173`, `:5174`, `:5175` (разные origin).  
Для синхронизации запустите **demo hub**:

```bash
npm run demo:hub
```

## Запуск полного цикла

**Терминал 1:**
```bash
npm run demo:hub
```

**Терминал 2:**
```bash
npm run dev:service   # :5173
npm run dev:partner   # :5174
npm run dev:admin     # :5175
```

## Демо-логины (пароль `1234`)

| Логин | Приложение | Роль |
|-------|------------|------|
| `uralsk_client` | GP Service | Клиент Уральск |
| `atyrau_client` | GP Service | Клиент Атырау |
| `uralsk_partner` | GP Partner | Партнёр Уральск |
| `atyrau_partner` | GP Partner | Партнёр Атырау |
| `uralsk_admin` | GP Admin | Франшиза Уральск |
| `atyrau_admin` | GP Admin | Франшиза Атырау |
| `superadmin` | GP Admin | Вся сеть |

## GP Market — ручная проверка

1. `npm run demo:hub` + три приложения.
2. **Partner** `uralsk_partner` / `1234` → **Мой магазин** → **Создать магазин** → добавить **Петуния** (цена, остаток).
3. **Service** `uralsk_client` / `1234` → **Магазин** → Петуния → корзина → оформить (доставка / Kaspi demo).
4. **Admin** `uralsk_admin` → **GP Market** → заказы / товары.
5. **Partner** → заказы → **Следующий статус** до **Выполнен**.
6. **Service** → Мои заявки — статус market обновлён.
7. `atyrau_admin` / `atyrau_client` — **не** видят товары и заказы Уральска.
8. `superadmin` — видит всё.

Веб-кабинет партнёра: `http://localhost:5174/cabinet`

## Ручная проверка цикла (услуги)

1. Service: `uralsk_client` / `1234` → выбрать город **Уральск** → услуга **Стрижка газона** → оформить заявку.
2. Admin: `uralsk_admin` → Заявки → назначить партнёра.
3. Partner: `uralsk_partner` → Мои заявки → Принял → Выехал → В работе → Выполнено.
4. Service: обновить «Мои заявки» — статус **выполнено**.
5. Admin `atyrau_admin` — **не** должен видеть заявку Уральска.
6. Partner `atyrau_partner` — **не** должен видеть её.

## Язык

Переключатель **RU | KZ | EN** в шапке всех трёх приложений. Ключ LocalStorage: `gp-lang` (в рамках одного origin; между портами язык не синхронизируется — только store через hub).

Партнёр в demo видит заявки **только после назначения** админом в GP Admin (вкладка «Новые» пустая — подсказка об этом).

## Отключить demo (вернуть API)

В `.env.development` приложения: `VITE_GP_DEMO=false`
