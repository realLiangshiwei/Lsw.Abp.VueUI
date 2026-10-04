import { defineToken, inject, provideAppInitializer } from '@lsw-abpvue/core';
import {
  EntityAction,
  EntityProp,
  ExtensionsService,
  FormProp,
  PropType,
  ToolbarAction,
} from '@lsw-abpvue/components';
import { Validators } from '@lsw-abpvue/theme-shared';

export interface CatalogBook {
  id: string;
  name: string;
  category?: string | undefined;
  price?: number | undefined;
  concurrencyStamp?: string | undefined;
  extraProperties?: Record<string, unknown> | undefined;
}
export const catalogKey = 'Catalog.BooksComponent';
export const CATALOG_PAGE = defineToken<{
  add(): void;
  edit(record: CatalogBook): Promise<void>;
  remove(record: CatalogBook): Promise<void>;
}>('CATALOG_PAGE');

export const catalogExtensions = provideAppInitializer(() => {
  const extensions = inject(ExtensionsService);
  extensions.entityProps.get<CatalogBook>(catalogKey).addContributor(props =>
    props.addTail(
      EntityProp.create<CatalogBook>({
        name: 'name',
        type: PropType.String,
        displayName: 'Name',
        sortable: true,
      }),
    ),
  );
  for (const factory of [extensions.createFormProps, extensions.editFormProps]) {
    factory.get<CatalogBook>(catalogKey).addContributor(props =>
      props.addTail(
        FormProp.create<CatalogBook>({
          name: 'name',
          type: PropType.String,
          displayName: 'Name',
          validators: () => [Validators.required(), Validators.maxLength(128)],
        }),
      ),
    );
  }
  extensions.entityActions.get<CatalogBook>(catalogKey).addContributor(props =>
    props.addManyTail([
      EntityAction.create<CatalogBook>({
        text: 'Edit',
        action: data => data.getInjected(CATALOG_PAGE).edit(data.record),
      }),
      EntityAction.create<CatalogBook>({
        text: 'Delete',
        action: data => data.getInjected(CATALOG_PAGE).remove(data.record),
      }),
    ]),
  );
  extensions.toolbarActions.get<readonly CatalogBook[]>(catalogKey).addContributor(props =>
    props.addTail(
      ToolbarAction.create<readonly CatalogBook[]>({
        text: 'New book',
        icon: 'bi bi-plus',
        action: data => data.getInjected(CATALOG_PAGE).add(),
      }),
    ),
  );
});
