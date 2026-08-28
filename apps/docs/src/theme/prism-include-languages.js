/**
 * Swizzled from @docusaurus/theme-classic to extend the bash grammar for
 * synth CLI sessions. Prism's stock bash grammar tokenizes only comments,
 * strings, flags, and a fixed list of well-known commands, so `synth`,
 * workspace refs (com.example/persons), and paths rendered as plain text.
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
    PrismObject.languages.insertBefore('bash', 'function', {
      // The synth binary itself, colored like other known commands.
      'synth-command': {
        pattern: /\bsynth\b/,
        alias: 'function',
      },
      // Workspace refs: com.example/persons, com.example/persons-cfg
      'workspace-ref': {
        pattern: /\b[\w-]+(?:\.[\w-]+)+\/[\w./-]+/,
        alias: 'attr-name',
      },
      // Filesystem paths: ./persons.tsx, ./generated, ~/.synth/, /usr/local
      'path': {
        pattern: /(^|\s)(?:\.{1,2}|~)?\/[\w.~/-]+/m,
        lookbehind: true,
        alias: 'string',
      },
    });
  }
}
