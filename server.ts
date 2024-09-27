import * as log from "https://deno.land/std@0.151.0/log/mod.ts";
import { SpellChecker } from "./spell_checker.ts";

const checker = new SpellChecker("./en_US.aff", "./en_US.dic");

const file = new log.handlers.FileHandler("NOTSET", { filename: "access.log" });

setInterval(() => file.flush(), 1000);

await log.setup({
  handlers: { file },
  loggers: {
    default: { handlers: ["file"] },
  },
});

Deno.serve(
  { port: Number(Deno.env.get("PORT")) || 3000 },
  async (request, connInfo) => {
    if (
      request.method == "POST"
    ) {
      if (
        request.headers.get("content-type") == "application/json"
      ) {
        const content = await request.json();
        if (
          typeof content === "string" && content.length > 0 &&
          // deno-lint-ignore no-control-regex
          content.length <= 4096 && /^[\x00-\x7F]*$/.test(content)
        ) {
          const parts = content.split(/(\W)/);
          const result = new Array<
            [string, { note?: string; correct: boolean }]
          >();
          const waitStart = Date.now();
          const waitEnd = Date.now();
          const start = Date.now();
          for (const part of parts) {
            const test = /^[A-z]*$/.test(part);
            const note = test ? undefined : "ignored";
            const correct = test ? checker.check(part) : true;
            result.push([part, { note, correct }]);
          }
          const end = Date.now();
          const checkTime = String(end - start);
          const waitTime = String(waitEnd - waitStart);
          log.info(
            `checked ${parts.length} parts for ${
              request.headers.get("x-forwarded-for") ??
                (connInfo.remoteAddr as Deno.NetAddr).hostname
            } in ${checkTime} with ${waitTime} of wait`,
          );
          return Response.json(result, {
            headers: {
              "content-type": "application/json",
              "x-check-time": checkTime,
              "x-wait-time": waitTime,
            },
          });
        }
      }
      return Response.json("400 Bad Request", { status: 400 });
    }
    // Good idea, @dcdunkan.
    return Response.redirect("https://github.com/rojvv/spell_checker");
  },
);
