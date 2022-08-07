# Spell Checker

> A Deno FFI experiment.

## Usage

1. Install or build [Hunspell](https://github.com/hunspell/hunspell#readme).
2. Clone.
3. Correct the lib path in `spell_checker.ts` if it is not.
4. Run `main.ts`:

```shell
deno run --allow-ffi --unstable main.ts
```

## The Server

There's an experimental HTTP server that can be tried:

```shell
deno --allow-env --allow-ffi --allow-net --allow-read --allow-write --unstable server.ts
```

You can then send requests like this:

```ts
await fetch("http://server", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify("somee bad sentense to chek"),
});
```

There's also a running instance of the HTTP server at <https://dsp.roj.im>.
