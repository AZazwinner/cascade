export type EvalResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

type TokenType = "number" | "op" | "lparen" | "rparen" | "eof";

interface Token {
  type: TokenType;
  value: string;
}

class Tier0Error extends Error {}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const isDigit = (c: string) => c >= "0" && c <= "9";
  const ops = new Set(["+", "-", "*", "/", "^"]);

  while (i < input.length) {
    const c = input[i];

    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i++;
      continue;
    }

    if (isDigit(c) || c === ".") {
      const start = i;
      let sawDot = false;
      while (i < input.length && (isDigit(input[i]) || input[i] === ".")) {
        if (input[i] === ".") {
          if (sawDot) throw new Tier0Error(`Malformed number near position ${i}`);
          sawDot = true;
        }
        i++;
      }
      const raw = input.slice(start, i);
      if (raw === "." || raw === "") {
        throw new Tier0Error(`Malformed number near position ${start}`);
      }
      tokens.push({ type: "number", value: raw });
      continue;
    }

    if (ops.has(c)) {
      tokens.push({ type: "op", value: c });
      i++;
      continue;
    }

    if (c === "(") {
      tokens.push({ type: "lparen", value: c });
      i++;
      continue;
    }

    if (c === ")") {
      tokens.push({ type: "rparen", value: c });
      i++;
      continue;
    }

    throw new Tier0Error(`Invalid character '${c}' at position ${i}`);
  }

  tokens.push({ type: "eof", value: "" });
  return tokens;
}

type Node =
  | { kind: "num"; value: number }
  | { kind: "bin"; op: "+" | "-" | "*" | "/" | "^"; left: Node; right: Node }
  | { kind: "neg"; value: Node };

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    return this.tokens[this.pos++];
  }

  private expect(type: TokenType): Token {
    const t = this.peek();
    if (t.type !== type) {
      throw new Tier0Error(`Expected ${type} but found '${t.value || "end of input"}'`);
    }
    return this.advance();
  }

  parseExpression(): Node {
    const node = this.parseExpr();
    this.expect("eof");
    return node;
  }

  private parseExpr(): Node {
    let node = this.parseTerm();
    while (this.peek().type === "op" && (this.peek().value === "+" || this.peek().value === "-")) {
      const op = this.advance().value as "+" | "-";
      const right = this.parseTerm();
      node = { kind: "bin", op, left: node, right };
    }
    return node;
  }

  private parseTerm(): Node {
    let node = this.parseUnary();
    while (this.peek().type === "op" && (this.peek().value === "*" || this.peek().value === "/")) {
      const op = this.advance().value as "*" | "/";
      const right = this.parseUnary();
      node = { kind: "bin", op, left: node, right };
    }
    return node;
  }

  private parseUnary(): Node {
    if (this.peek().type === "op" && this.peek().value === "-") {
      this.advance();
      return { kind: "neg", value: this.parseUnary() };
    }
    return this.parsePower();
  }

  private parsePower(): Node {
    const base = this.parseAtom();
    if (this.peek().type === "op" && this.peek().value === "^") {
      this.advance();
      const exponent = this.parseUnary();
      return { kind: "bin", op: "^", left: base, right: exponent };
    }
    return base;
  }

  private parseAtom(): Node {
    const t = this.peek();
    if (t.type === "number") {
      this.advance();
      return { kind: "num", value: Number(t.value) };
    }
    if (t.type === "lparen") {
      this.advance();
      const node = this.parseExpr();
      this.expect("rparen");
      return node;
    }
    throw new Tier0Error(`Unexpected token '${t.value || "end of input"}'`);
  }
}

function evaluate(node: Node): number {
  switch (node.kind) {
    case "num":
      return node.value;
    case "neg":
      return -evaluate(node.value);
    case "bin": {
      const l = evaluate(node.left);
      const r = evaluate(node.right);
      switch (node.op) {
        case "+":
          return l + r;
        case "-":
          return l - r;
        case "*":
          return l * r;
        case "/":
          if (r === 0) throw new Tier0Error("Division by zero");
          return l / r;
        case "^":
          return Math.pow(l, r);
      }
    }
  }
}

export function tryEvaluateArithmetic(input: string): EvalResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Empty input" };
  }

  if (!/\d/.test(trimmed)) {
    return { ok: false, error: "No digits present" };
  }
  if (!/^[\d+\-*/^().\s]+$/.test(trimmed)) {
    return { ok: false, error: "Contains non-arithmetic characters" };
  }

  try {
    const tokens = tokenize(trimmed);
    const parser = new Parser(tokens);
    const ast = parser.parseExpression();
    const value = evaluate(ast);
    if (!Number.isFinite(value)) {
      return { ok: false, error: "Result is not finite" };
    }
    return { ok: true, value };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown evaluation error";
    return { ok: false, error: message };
  }
}
