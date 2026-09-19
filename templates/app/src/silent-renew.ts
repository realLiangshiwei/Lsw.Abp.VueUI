import { completeSilentRenew } from '@lsw-abpvue/oauth';

// The page the token renewal iframe loads. Nothing of the application is here on purpose:
// it runs once every access token lifetime, and the whole shell would boot with it.
void completeSilentRenew();
