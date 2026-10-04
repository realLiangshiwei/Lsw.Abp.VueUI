<script setup>
import Example from '../examples/PageAlertsExample.vue';
</script>

# Page alerts

Use `PageAlertService` for a message that should stay near the page content, such as a failed catalogue load or a notice requiring attention. Use a toast for brief feedback after a completed operation.

## Show, replace and remove

<ClientOnly><DocsDemo :example="Example" note="This example uses isolated local alert state." /></ClientOnly>

<<< ../examples/PageAlertsExample.vue

The same id replaces an existing alert instead of adding duplicates. `show` returns the id when you let the service generate it. Remove that id after recovery or when its owning page unmounts. Avoid `clear()` in an unrelated component: it removes other owners' alerts too.

## Rendering and scope

`usePageAlert()` comes from theme-shared. The Basic Theme renderer `AbpPageAlerts` comes from theme-basic; use your theme's renderer in a custom theme. The default Basic application layout already renders alerts, so do not add a second renderer to an ordinary page. The isolated example includes one because it has no application layout.

Alert state belongs to its injector. Page unmount does not automatically destroy the root service; explicit cleanup prevents a page-specific message appearing on the next route. For independently scoped views, provide the service in the view injector and use a matching renderer.

## Messages and recovery

`severity` accepts neutral, info, success, warning or error. `title` and `message` are localization parameters, with separate interpolation arrays. `dismissible` defaults to true; dismissing a message is not the same as retrying the failed request.

Keep Retry close to the affected operation and remove the alert only after a successful recovery. A form's member errors still belong in the fields. See [HTTP failures](/core/http-errors), [notifications](/utilities/notifications) and [form validation](/utilities/forms).
