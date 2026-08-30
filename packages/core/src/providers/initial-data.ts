import { inject } from '../di/inject';
import { ConfigStateService } from '../services/config-state.service';
import { MultiTenancyService } from '../services/multi-tenancy.service';
import { SessionStateService } from '../services/session-state.service';
import { AuthService, CHECK_AUTHENTICATION_STATE_FN } from '../tokens/auth.token';
import { ABP_ROOT_OPTIONS } from '../tokens/root-options.token';

/**
 * What has to happen before the application is shown, in the order ABP defines it:
 * restore the session, work out the tenant from the address bar, restore or complete a
 * login, then ask the backend who the user is and what they may do.
 *
 * The order is the point. The tenant has to be known before authentication starts,
 * because a token is issued per tenant, and before the configuration request goes out,
 * because that request is answered per tenant.
 */
export async function getInitialData(): Promise<void> {
  const options = inject(ABP_ROOT_OPTIONS);
  const session = inject(SessionStateService);
  const multiTenancy = inject(MultiTenancyService);
  const configState = inject(ConfigStateService);
  const auth = inject(AuthService, { optional: true });
  const checkAuthenticationState = inject(CHECK_AUTHENTICATION_STATE_FN);

  session.init();
  await multiTenancy.resolveFromUrl();

  if (auth && !options.skipInitAuthService) await auth.init();
  if (options.skipGetAppConfiguration) return;

  const configuration = await configState.refreshAppState();
  // A token the backend no longer honours answers as an anonymous user rather than a
  // 401, so the only place to notice it is here, against the configuration it produced.
  checkAuthenticationState();
  session.setTenant(configuration.currentTenant.id ? configuration.currentTenant : null);

  // The backend answers with the culture it actually applied, which is the normalised
  // form of what we asked for -- `tr;q=0.9` comes back as `tr`.
  const culture = configuration.localization.currentCulture.cultureName?.split(';')[0];
  if (culture) {
    session.setLanguage(culture);
    await configState.refreshLocalization(culture);
  }
}
