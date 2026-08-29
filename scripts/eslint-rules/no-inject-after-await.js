/**
 * The injection context is synchronous: it is established around a factory call, a
 * component's setup or `runInInjectionContext`, and it is gone as soon as the function
 * suspends. Calling `inject()` afterwards fails at runtime with an error that points at
 * the wrong place, so it is worth catching while typing (design 02 §5).
 */
const CONTEXT_BOUND = new Set(['inject', 'provideAbp', 'onServiceDestroy', 'getCurrentInjector']);

/** @type {import('eslint').Rule.RuleModule} */
export const noInjectAfterAwait = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow calls that need an injection context after an await, where there is none left.',
    },
    schema: [],
    messages: {
      afterAwait:
        '{{name}}() runs outside the injection context here: the context ends at the first await. Capture what you need before awaiting — `const injector = getCurrentInjector();` — and use `injector.get(...)` afterwards.',
    },
  },

  create(context) {
    // One frame per function, plus the module itself for top-level await.
    const awaitedIn = [[]];
    const frame = () => awaitedIn[awaitedIn.length - 1];

    return {
      ':function': () => awaitedIn.push([]),
      ':function:exit': () => awaitedIn.pop(),

      AwaitExpression: node => frame().push(node.range[1]),

      CallExpression(node) {
        const { callee } = node;
        if (callee.type !== 'Identifier' || !CONTEXT_BOUND.has(callee.name)) return;
        if (!frame().some(end => end < node.range[0])) return;

        context.report({ node, messageId: 'afterAwait', data: { name: callee.name } });
      },
    };
  },
};
