# 日期与时区

选择模型前，先区分字段表示日历日期、本地钟表时间还是具体时间点。控件显示、DTO 值与请求时区头有不同职责。

## 选择表示方式

| 业务值 | 表示 | 示例 |
| --- | --- | --- |
| 出版日期 | 只含日期的字符串 | 2026-10-04 |
| 每日营业时间 | 只含时间的字符串 | 09:30 |
| 需要按指定时区解释的预约 | 本地日期时间加明确时区 | 2026-10-04T09:30、Asia/Shanghai |
| 已发生事件的时间点 | 带偏移的时间戳 | 2026-10-04T01:30:00Z |

[日期控件](/zh/components/date-picker) 使用 string/null，不把本地预约自动转成 UTC。转换由 DTO 与业务规则决定。夏令时的歧义时间需要明确策略，控件不会自动选择。

## 格式化显示

创建 src/utils/date-display.ts：

<<< ../../examples/date-display.ts

在 computed 或模板使用的函数中调用 `formatInstant(record.createdAt, localization.currentLang.value, 'Asia/Shanghai')`，输入应是带偏移的有效 ISO 时间戳。有效的日期 DTO 可调用 `formatCalendarDate('2026-10-04', culture)`。这里仅用 UTC 格式化以保留日历日，不是把生日转换成具体时间点。

不要把只含日期的字段按 UTC 解析后再用任意本地时区显示，否则可能显示前一天。本地日期时间也不能在尚未明确用户所指时区时直接用 toISOString() 保存。

## 框架请求头

应用配置 clock.kind 为 Utc 时，时区拦截器添加 __timezone。优先使用 setting.values['Abp.Timing.TimeZone']，否则使用浏览器 Intl 解析的时区。已有请求头会保留，skipAddingHeader 会跳过该请求的框架头添加。

请求头提供后端请求上下文，不重写 JSON 日期，也不决定日期控件模型格式。租户或用户设置变化时检查有效配置，改变有效时区后刷新配置。

## 检查日期行为

检查午夜附近日期、同一时间点在两个时区的显示、空可选字段及后端夏令时规则。无效数据应给出反馈，不能猜测时区后保存。参见[HTTP](/zh/core/http)、[设置](/zh/core/settings-features)和[本地化](/zh/concepts/localization)。
