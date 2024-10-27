declare module "@eslint/eslintrc" {
  import type { Linter } from "eslint";

  export class FlatCompat {
    constructor({
      baseDirectory,
    }: {
      baseDirectory: string;
      recommendedConfig: {
        readonly rules: Readonly<Linter.RulesRecord>;
      };
      allConfig: {
        readonly rules: Readonly<Linter.RulesRecord>;
      };
    });

    extends(...extendsValues: string[]): Linter.Config & {
      [Symbol.iterator]: () => IterableIterator<Linter.Config>;
    };
  }
}
