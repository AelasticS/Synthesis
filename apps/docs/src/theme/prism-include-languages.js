/**
 * Swizzled from @docusaurus/theme-classic to extend the bash grammar for
 * synth CLI sessions. Prism's stock bash grammar tokenizes only comments,
 * strings, and a fixed list of well-known commands, and its flag pattern
 * rejects hyphenated flag names (--out-dir), which left them gray next to
 * colored flags on the same line.
 *
 * Consistency scheme (colors defined in docusaurus.config.ts):
 *   commands (synth, curl, tar, ...)      -> function color
 *   flags (--in, --default-configs, -q)   -> 'parameter'
 *   operands (refs, paths, names, URLs)   -> 'operand-path' / 'operand-name'
 *   quoted strings                        -> string color
 *   comments                              -> comment color
 * Bare single words (subcommands, plain arguments) stay plain.
 */
import siteConfig from '@generated/docusaurus.config';

export default function prismIncludeLanguages(PrismObject) {
  const {
    themeConfig: {prism},
  } = siteConfig;
  const {additionalLanguages} = prism;
  // Prism components work on the Prism instance on the window, while prism-
  // react-renderer uses its own Prism instance. We temporarily mount the
  // instance onto window, import components to enhance it, then remove it to
  // avoid polluting global namespace.
  const PrismBefore = globalThis.Prism;
  globalThis.Prism = PrismObject;
  additionalLanguages.forEach((lang) => {
    if (lang === 'php') {
      // eslint-disable-next-line global-require
      require('prismjs/components/prism-markup-templating.js');
    }
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require(`prismjs/components/prism-${lang}`);
  });
  // Clean up and eventually restore former globalThis.Prism object (if any)
  delete globalThis.Prism;
  if (typeof PrismBefore !== 'undefined') {
    globalThis.Prism = PrismObject;
  }

  if (PrismObject.languages.bash) {
    const bash = PrismObject.languages.bash;
    // Replace the stock flag pattern: it disallows hyphens inside flag
    // names, so --in matched but --default-configs did not.
    bash.parameter = {
      pattern: /(^|\s)-{1,2}[\w-]+(?==|\s|$)/m,
      lookbehind: true,
    };
    PrismObject.languages.insertBefore('bash', 'function', {
      // The synth binary, colored like other recognized commands.
      'synth-command': {
        pattern: /\bsynth\b/,
        alias: 'function',
      },
      // Slash-bearing operands: URLs, filesystem paths, workspace refs,
      // package specifiers (com.example/persons, ./generated, ~/.synth,
      // common/scripts/x.js, https://..., @scope/name).
      'operand-path': {
        pattern:
          /(^|\s)(?:[\w+]+:\/\/[\w./~-]+|(?:\.{1,2}\/|~\/|\/)[\w.~/-]+)|@?\b[\w.-]+(?:\/[\w.-]+)+/m,
        lookbehind: true,
      },
      // Dotted or hyphenated bare names: transformation and pipeline
      // names (eer-to-relational, gen-sql), namespaces (com.example).
      'operand-name': {
        pattern: /\b[A-Za-z]\w*(?:[-.]\w+)+\b/,
      },
    });
  }
}
