import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';
import { createInjector } from '../di/injector';
import { ReplaceableComponentsService } from './replaceable-components.service';

const Custom = defineComponent({ name: 'CustomUsers', render: () => null });
const Other = defineComponent({ name: 'OtherUsers', render: () => null });

describe('ReplaceableComponentsService', () => {
  it('a key nobody registered is undefined', () => {
    expect(
      createInjector([]).get(ReplaceableComponentsService).get('Identity.UsersComponent'),
    ).toBeUndefined();
  });

  it('reads back by key once registered', () => {
    const service = createInjector([]).get(ReplaceableComponentsService);

    service.add({ key: 'Identity.UsersComponent', component: Custom });

    expect(service.get('Identity.UsersComponent')?.component).toBe(Custom);
  });

  it('registering again replaces', () => {
    const service = createInjector([]).get(ReplaceableComponentsService);

    service.add({ key: 'Identity.UsersComponent', component: Custom });
    service.add({ key: 'Identity.UsersComponent', component: Other });

    expect(service.get('Identity.UsersComponent')?.component).toBe(Other);
  });

  it('the reference form is reactive', () => {
    const service = createInjector([]).get(ReplaceableComponentsService);
    const component = service.getRef('Identity.UsersComponent');
    expect(component.value).toBeUndefined();

    service.add({ key: 'Identity.UsersComponent', component: Custom });

    expect(component.value).toBe(Custom);
  });
});
