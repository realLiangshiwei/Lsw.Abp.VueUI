<script setup lang="ts">
import {
  getCurrentInjector,
  inject,
  RoutesService,
  runInInjectionContext,
  useListService,
} from '@lsw-abpvue/core';
import {
  AbpExtensibleTable,
  AbpExtensibleForm,
  EntityAction,
  EntityProp,
  ExtensionsService,
  mergeWithDefaultActions,
  mergeWithDefaultProps,
  PropType,
  FormProp,
  useExtensibleForm,
  type ExtensibleForm,
} from '@lsw-abpvue/components';
import { nextTick, ref, shallowRef } from 'vue';
import AbpRoutes from '../../packages/theme-basic/src/components/nav/AbpRoutes.vue';

interface RecordRow {
  id: string;
  name: string;
  category: string;
  price: number;
  published: boolean;
  date: string;
  extraProperties?: Record<string, unknown> | undefined;
}

interface Result {
  scenario: string;
  rendered: number;
  cells: number;
  mountMs: number;
  medianMs: number;
  p95Ms: number;
  samples: number[];
}

const extensions = inject(ExtensionsService);
const injector = getCurrentInjector();
const baseProps = [
  EntityProp.create<RecordRow>({ name: 'id', type: PropType.String }),
  EntityProp.create<RecordRow>({ name: 'name', type: PropType.String }),
  EntityProp.create<RecordRow>({ name: 'category', type: PropType.String }),
  EntityProp.create<RecordRow>({ name: 'price', type: PropType.Number }),
  EntityProp.create<RecordRow>({ name: 'published', type: PropType.Boolean }),
  EntityProp.create<RecordRow>({ name: 'date', type: PropType.Date }),
];
mergeWithDefaultProps(extensions.entityProps, { 'Benchmarks.Records': baseProps });
mergeWithDefaultActions(extensions.entityActions, {
  'Benchmarks.Records': [
    EntityAction.create<RecordRow>({ text: 'Edit', action: () => {} }),
    EntityAction.create<RecordRow>({ text: 'Delete', action: () => {} }),
  ],
});

const routes = inject(RoutesService);
const list = useListService();
const rows = shallowRef<RecordRow[]>([]);
const phase = ref<'table' | 'menu' | 'form' | undefined>();
const extraForm = shallowRef<ExtensibleForm<RecordRow>>();
const surface = ref<HTMLElement>();
const results = shallowRef<Result[]>([]);
const busy = ref(false);
const failure = ref('');
const browser = navigator.userAgent;
const viewport = `${window.innerWidth} × ${window.innerHeight}`;
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

function layout(): void {
  surface.value?.getBoundingClientRect();
}

async function measure(scenario: string, prepare: () => void, update: (turn: number) => void) {
  await frame();
  const mountStart = performance.now();
  prepare();
  await nextTick();
  layout();
  const mountMs = performance.now() - mountStart;
  const samples: number[] = [];

  for (let turn = 0; turn <= 20; turn += 1) {
    await frame();
    if (document.visibilityState !== 'visible') throw new Error('Keep this tab in the foreground.');
    const start = performance.now();
    update(turn);
    await nextTick();
    layout();
    if (turn > 0) samples.push(performance.now() - start);
  }

  const sorted = [...samples].sort((a, b) => a - b);
  return {
    scenario,
    rendered:
      surface.value?.querySelectorAll(
        phase.value === 'table'
          ? 'tbody tr'
          : phase.value === 'form'
            ? 'input[name^="extra"]'
            : 'li',
      ).length ?? 0,
    cells: surface.value?.querySelectorAll('tbody td').length ?? 0,
    mountMs,
    medianMs: ((sorted[9] ?? 0) + (sorted[10] ?? 0)) / 2,
    p95Ms: sorted[18] ?? 0,
    samples,
  };
}

async function run(): Promise<void> {
  busy.value = true;
  failure.value = '';
  results.value = [];
  phase.value = undefined;
  await nextTick();

  try {
    mergeWithDefaultProps(extensions.entityProps, { 'Benchmarks.Records': baseProps });
    for (const size of [50, 1000]) {
      const records = Array.from({ length: size }, (_, index) => ({
        id: String(index),
        name: `Record ${index}`,
        category: 'Books',
        price: index / 10,
        published: index % 2 === 0,
        date: '2026-10-02',
      }));
      const result = await measure(
        `${size} table rows, 6 columns and row actions`,
        () => {
          rows.value = records;
          list.totalCount.value = size;
          list.maxResultCount.value = size;
          phase.value = 'table';
        },
        turn => {
          rows.value = records.map(record => ({ ...record, name: `${record.name}: ${turn}` }));
        },
      );
      results.value = [...results.value, result];
      phase.value = undefined;
      await nextTick();
    }

    const wideProps = Array.from({ length: 44 }, (_, index) =>
      EntityProp.create<RecordRow>({
        name: `extra${index}`,
        displayName: `Extra ${index}`,
        type: PropType.Number,
        isExtra: true,
        columnWidth: 120,
      }),
    );
    const wideRecords = Array.from({ length: 50 }, (_, index) => ({
      id: String(index),
      name: `Record ${index}`,
      category: 'Books',
      price: index / 10,
      published: index % 2 === 0,
      date: '2026-10-03',
      extraProperties: Object.fromEntries(wideProps.map(prop => [prop.name, index])),
    }));
    const wideResult = await measure(
      '50 table rows, 50 data columns and row actions',
      () => {
        mergeWithDefaultProps(extensions.entityProps, {
          'Benchmarks.Records': [...baseProps, ...wideProps],
        });
        rows.value = wideRecords;
        list.totalCount.value = 50;
        list.maxResultCount.value = 50;
        phase.value = 'table';
      },
      turn => {
        rows.value = wideRecords.map(record => ({
          ...record,
          extraProperties: Object.fromEntries(wideProps.map(prop => [prop.name, turn])),
        }));
      },
    );
    results.value = [...results.value, wideResult];
    phase.value = undefined;
    await nextTick();

    const formProps = Array.from({ length: 100 }, (_, index) =>
      FormProp.create<RecordRow>({
        name: `extra${index}`,
        displayName: `Extra ${index}`,
        type: PropType.String,
        isExtra: true,
      }),
    );
    const formResult = await measure(
      '100 extra properties in an extensible form',
      () => {
        if (!injector) throw new Error('The benchmark application has no injector.');
        mergeWithDefaultProps(extensions.createFormProps, { 'Benchmarks.Records': formProps });
        extraForm.value = runInInjectionContext(injector, () => useExtensibleForm<RecordRow>());
        phase.value = 'form';
      },
      turn => {
        for (const prop of formProps) {
          const control = extraForm.value?.form.get(prop.name);
          if (control) control.value = `Value ${turn}`;
        }
      },
    );
    results.value = [...results.value, formResult];
    phase.value = undefined;
    await nextTick();

    routes.remove(routes.flat.value.map(route => route.name));
    const result = await measure(
      '1000 menu entries, 20 groups',
      () => {
        routes.add(
          Array.from({ length: 1000 }, (_, index) => ({
            name: `Item ${index}`,
            path: `/item-${index}`,
            order: index,
            group: `Group ${Math.floor(index / 50)}`,
          })),
        );
        phase.value = 'menu';
      },
      turn => {
        routes.patch('Item 999', { order: turn % 2 === 0 ? -1 : 999 });
      },
    );
    results.value = [...results.value, result];
  } catch (error) {
    failure.value = error instanceof Error ? error.message : String(error);
  } finally {
    phase.value = undefined;
    busy.value = false;
  }
}
</script>

<template>
  <main class="container py-4">
    <h1>ABP Vue UI browser benchmarks</h1>
    <p class="small text-muted">{{ browser }} · {{ viewport }}</p>
    <p>
      Production components, synthetic records, no backend requests. Keep this tab in the
      foreground.
    </p>
    <button type="button" class="btn btn-primary" :disabled="busy" @click="run">
      {{ busy ? 'Measuring…' : 'Run benchmarks' }}
    </button>
    <p v-if="failure" role="alert">{{ failure }}</p>
    <table v-if="results.length" class="table mt-3">
      <caption>
        Vue updates and synchronous layout, milliseconds; 20 samples after one warm-up
      </caption>
      <thead>
        <tr>
          <th>Scenario</th>
          <th>Rendered</th>
          <th>Cells</th>
          <th>Mount</th>
          <th>Median update</th>
          <th>p95 update</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="result in results" :key="result.scenario">
          <td>{{ result.scenario }}</td>
          <td>{{ result.rendered }}</td>
          <td>{{ result.cells }}</td>
          <td>{{ result.mountMs.toFixed(2) }}</td>
          <td>{{ result.medianMs.toFixed(2) }}</td>
          <td>{{ result.p95Ms.toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>
    <details v-if="results.length">
      <summary>Raw samples</summary>
      <pre>{{ JSON.stringify(results, null, 2) }}</pre>
    </details>
    <div ref="surface" class="benchmark-surface mt-3">
      <AbpExtensibleTable
        v-if="phase === 'table'"
        :data="rows"
        :list="list"
        record-key="id"
        caption="Records"
      />
      <AbpRoutes v-if="phase === 'menu'" />
      <AbpExtensibleForm v-if="phase === 'form' && extraForm" :form="extraForm" />
    </div>
  </main>
</template>

<style scoped>
.benchmark-surface {
  max-height: 260px;
  overflow: auto;
}
</style>
