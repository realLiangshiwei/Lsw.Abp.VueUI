# Dates and timezone

Decide whether a field represents a calendar date, a local wall time or an instant before choosing its model. A date picker display, a DTO value and the request's timezone header serve different purposes.

## Choose a representation

| Business value | Representation | Example |
| --- | --- | --- |
| Publication date | Date-only string | `2026-10-04` |
| Daily opening time | Time-only string | `09:30` |
| Local appointment to be resolved in a named zone | Local date-time plus explicit zone | `2026-10-04T09:30`, `Asia/Shanghai` |
| A completed event's instant | Offset-bearing timestamp | `2026-10-04T01:30:00Z` |

[AbpDatePicker](/components/date-picker) uses string/null models and does not convert a local appointment to UTC. The backend DTO and your business rules determine conversion. An ambiguous daylight-saving time requires a policy; the control does not choose one automatically.

## Format values for display

Create `src/utils/date-display.ts`:

<<< ../examples/date-display.ts

Call `formatInstant(record.createdAt, localization.currentLang.value, 'Asia/Shanghai')` inside a computed or template-facing function. It expects a valid offset-bearing ISO timestamp. Call `formatCalendarDate('2026-10-04', culture)` for a valid date-only DTO string. This deliberately uses UTC for formatting to preserve the calendar day; it does not convert a birthday into an instant.

Never format a date-only field by parsing it as UTC and then rendering in an arbitrary local zone: that can show the previous day. Do not silently serialize a local date-time with `toISOString()` without establishing the user's intended timezone.

## Framework request header

When application configuration has `clock.kind === 'Utc'`, the timezone interceptor supplies `__timezone`. It uses `setting.values['Abp.Timing.TimeZone']`, falling back to the browser's Intl-resolved zone. An explicitly supplied header is preserved. `skipAddingHeader` skips framework header additions for that request.

This header gives the backend request context; it does not rewrite dates in your JSON body or choose the date picker's model format. Inspect effective application configuration when a tenant or user setting changes, and refresh it after changing an effective timezone.

## Check date behavior

Test date-only values near midnight, an offset-bearing instant displayed in two zones, an empty optional field and the backend's DST rule. Keep invalid data feedback visible rather than saving a guessed timezone. See [HTTP](/core/http), [settings](/core/settings-features) and [localization](/concepts/localization).
