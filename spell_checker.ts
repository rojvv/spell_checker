const dl = Deno.dlopen("/usr/lib/libhunspell-1.7.so", {
  "Hunspell_analyze": {
    parameters: ["pointer", "pointer", "buffer"],
    result: "i32",
  },
  "Hunspell_create": { parameters: ["buffer", "buffer"], result: "pointer" },
  "Hunspell_destroy": {
    parameters: ["pointer"],
    result: "void",
  },
  "Hunspell_spell": { parameters: ["pointer", "buffer"], result: "i32" },
  "Hunspell_suggest": {
    parameters: ["pointer", "pointer", "buffer"],
    result: "i32",
  },
});

// https://discord.com/channels/684898665143206084/956626010248478720/1005539135899054080
function getCStrings(view: Deno.UnsafePointerView, length: number) {
  const pointers = [...new BigUint64Array(view.getArrayBuffer(length * 8))];
  return pointers.map((v) =>
    new Deno.UnsafePointerView(Deno.UnsafePointer.create(v)!).getCString()
  );
}

// https://discord.com/channels/684898665143206084/956626010248478720/1005504203709493338
class PointerContainer {
  constructor(private arr = new BigUint64Array(1)) {
  }

  use() {
    return this.arr;
  }

  get() {
    return this.arr[0];
  }
}

export class SpellChecker {
  private instance: Deno.PointerValue;
  private encoder = new class extends TextEncoder {
    encode(input?: string) {
      return new Uint8Array([...super.encode(input), 0]);
    }
  }();

  constructor(affixPath: string, dictionaryPath: string) {
    this.instance = dl.symbols.Hunspell_create(
      this.encoder.encode(affixPath),
      this.encoder.encode(dictionaryPath),
    )!;
    // https://discord.com/channels/684898665143206084/956626010248478720/1005488431046086696
    new FinalizationRegistry((value: NonNullable<Deno.PointerValue>) =>
      dl.symbols.Hunspell_destroy(value)
    ).register(this, this.instance);
  }

  check(word: string) {
    return dl.symbols.Hunspell_spell(
      this.instance,
      this.encoder.encode(word),
    ) != 0;
  }

  suggest(word: string) {
    const pointer = new PointerContainer();
    const length = dl.symbols.Hunspell_suggest(
      this.instance,
      Deno.UnsafePointer.of(pointer.use()),
      this.encoder.encode(word),
    );
    return getCStrings(
      new Deno.UnsafePointerView(Deno.UnsafePointer.create(pointer.get())!),
      length,
    );
  }

  analyze(word: string) {
    const pointer = new PointerContainer();
    const length = dl.symbols.Hunspell_analyze(
      this.instance,
      Deno.UnsafePointer.of(pointer.use()),
      this.encoder.encode(word),
    );
    return getCStrings(
      new Deno.UnsafePointerView(Deno.UnsafePointer.create(pointer.get())!),
      length,
    );
  }
}
