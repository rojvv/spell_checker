import * as log from "https://deno.land/std@0.151.0/log/mod.ts";
import { Mutex } from "https://cdn.skypack.dev/async-mutex?dts";
import { serve } from "https://deno.land/std@0.151.0/http/mod.ts";
import { SpellChecker } from "./spell_checker.ts";

const mutex = new Mutex();
const checker = new SpellChecker("./en_US.aff", "./en_US.dic");

const file = new log.handlers.FileHandler("NOTSET", { filename: "access.log" });

setInterval(() => file.flush(), 1000);

await log.setup({
  handlers: { file },
  loggers: {
    default: { handlers: ["file"] },
  },
});

serve(async (req, connInfo) => {
  if (
    req.method == "POST" &&
    req.headers.get("content-type") == "application/json"
  ) {
    const content = await req.json();
    if (
      typeof content === "string" && content.length > 0 &&
      // deno-lint-ignore no-control-regex
      content.length <= 4096 && /^[\x00-\x7F]*$/.test(content)
    ) {
      const parts = content.split(/(\W)/);
      const result = new Array<[string, { note?: string; correct: boolean }]>();
      const waitStart = Date.now();
      const release = await mutex.acquire();
      const waitEnd = Date.now();
      const start = Date.now();
      for (const part of parts) {
        const test = /^[A-z]*$/.test(part);
        const note = test ? undefined : "ignored";
        const correct = test ? true : checker.check(part);
        result.push([part, { note, correct }]);
      }
      const end = Date.now();
      release();
      const checkTime = String(end - start);
      const waitTime = String(waitEnd - waitStart);
      log.info(
        `checked ${parts.length} parts for ${
          req.headers.get("x-forwarded-for") ??
            (connInfo.remoteAddr as Deno.NetAddr).hostname
        } in ${checkTime} with ${waitTime} of wait`,
      );
      return new Response(JSON.stringify(result), {
        headers: {
          "content-type": "application/json",
          "x-check-time": checkTime,
          "x-wait-time": waitTime,
        },
      });
    }
  }
  return new Response(JSON.stringify("400 Bad Request"), { status: 400 });
}, { port: Number(Deno.env.get("PORT")) || 3000 });
