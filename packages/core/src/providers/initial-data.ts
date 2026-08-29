import { inject } from '../di/inject';
import { ConfigStateService } from '../services/config-state.service';
import { MultiTenancyService } from '../services/multi-tenancy.service';
import { SessionStateService } from '../services/session-state.service';
import { ABP_ROOT_OPTIONS } from '../tokens/root-options.token';

/**
 * What has to happen before the application is shown, in the order ABP defines it:
 * restore the session, work out the tenant from the address bar, then ask the backend
 * who the user is and what they may do.
 *
 * The order is the point. The tenant has to be known before the configuration request
 * goes out, because that request is answered per tenant.
 */
export async function getInitialData(): Promise<void> {
  const options = inject(ABP_ROOT_OPTIONS);
  const session = inject(SessionStateService);
  const multiTenancy = inject(MultiTenancyService);
  const configState = inject(ConfigStateService);

  session.init();
  await multiTenancy.resolveFromUrl();

  if (options.skipGetAppConfiguration) return;

  const configuration = await configState.refreshAppState();
  session.setTenant(configuration.currentTenant.id ? configuration.currentTenant : null);

  // The backend answers with the culture it actually applied, which is the normalised
  // form of what we asked for -- `tr;q=0.9` comes back as `tr`.
  const culture = configuration.localization.currentCulture.cultureName?.split(';')[0];
  if (culture) {
    session.setLanguage(culture);
    await configState.refreshLocalization(culture);
  }
}
