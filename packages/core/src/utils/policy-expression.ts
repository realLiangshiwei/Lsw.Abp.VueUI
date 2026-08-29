type Token = { kind: 'name'; value: string } | { kind: '(' | ')' | '&&' | '||' };

export type PolicyExpression =
  | { kind: 'name'; value: string }
  | { kind: 'and' | 'or'; left: PolicyExpression; right: PolicyExpression };

const OPERATORS = new Set(['&', '|']);

function tokenize(input: string): Token[] | null {
  const tokens: Token[] = [];
  let index = 0;

  while (index < input.length) {
    const char = input[index] as string;

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (char === '(' || char === ')') {
      tokens.push({ kind: char });
      index += 1;
      continue;
    }

    if (OPERATORS.has(char)) {
      // A single `&` or `|` is a typo, not an operator anyone meant.
      if (input[index + 1] !== char) return null;
      tokens.push({ kind: char === '&' ? '&&' : '||' });
      index += 2;
      continue;
    }

    let end = index;
    while (end < input.length && !/[\s()&|]/.test(input[end] as string)) end += 1;
    tokens.push({ kind: 'name', value: input.slice(index, end) });
    index = end;
  }

  return tokens;
}

/**
 * `expr := term ('||' term)*`, `term := factor ('&&' factor)*`,
 * `factor := '(' expr ')' | NAME` — so `&&` binds tighter than `||`, as everywhere else.
 */
function parse(tokens: Token[]): PolicyExpression | null {
  let position = 0;
  const peek = () => tokens[position];

  function factor(): PolicyExpression | null {
    const token = peek();
    if (!token) return null;

    if (token.kind === 'name') {
      position += 1;
      return { kind: 'name', value: token.value };
    }

    if (token.kind !== '(') return null;
    position += 1;

    const inner = expression();
    if (!inner || peek()?.kind !== ')') return null;
    position += 1;

    return inner;
  }

  function term(): PolicyExpression | null {
    let left = factor();

    while (left && peek()?.kind === '&&') {
      position += 1;
      const right = factor();
      if (!right) return null;
      left = { kind: 'and', left, right };
    }

    return left;
  }

  function expression(): PolicyExpression | null {
    let left = term();

    while (left && peek()?.kind === '||') {
      position += 1;
      const right = term();
      if (!right) return null;
      left = { kind: 'or', left, right };
    }

    return left;
  }

  const parsed = expression();
  return parsed && position === tokens.length ? parsed : null;
}

/**
 * Parses a policy expression. `null` means the expression is malformed, which callers
 * report rather than throw: these strings usually come from route data, and an exception
 * there takes the whole navigation down.
 * @param policy Expression such as `(A || B) && C`
 */
export function parsePolicy(policy: string): PolicyExpression | null {
  const tokens = tokenize(policy);
  return tokens && tokens.length > 0 ? parse(tokens) : null;
}

/**
 * @param expression Parsed policy
 * @param isGranted Answers for a single permission name
 */
export function evaluatePolicy(
  expression: PolicyExpression,
  isGranted: (name: string) => boolean,
): boolean {
  switch (expression.kind) {
    case 'name':
      return isGranted(expression.value);
    case 'and':
      return (
        evaluatePolicy(expression.left, isGranted) && evaluatePolicy(expression.right, isGranted)
      );
    case 'or':
      return (
        evaluatePolicy(expression.left, isGranted) || evaluatePolicy(expression.right, isGranted)
      );
  }
}
