import { SpellChecker } from "./spell_checker.ts";

const checker = new SpellChecker("./en_US.aff", "./en_US.dic");

while (true) {
  const words = prompt("Words");
  if (!words) {
    break;
  }
  for (const word of words.split(/\s/)) {
    const correct = checker.check(word);
    const suggestions = checker.suggest(word);
    console.log(
      `${word}: ${
        correct
          ? "correct"
          : `incorrect, ${
            suggestions.length == 0
              ? "no suggestions available"
              : `here are 2 suggestions: ${suggestions.slice(0, 2).join(", ")}`
          }`
      }`,
    );
  }
}
