/* =============================================================================
   Skriptorium – Hervorhebung von Code (highlight.js), als Modul
   -----------------------------------------------------------------------------
   Lädt den Kern der Bibliothek und die Sprachen, die die Unterlage nennt (`code`
   in skriptorium.yml; der Adapter löst Kurznamen auf: html → xml) – aus dem
   Attribut `data-skr-highlight` am Skript, das sie einbindet. Gefärbt wird jeder
   Block, dessen Sprache – Name oder Kurzname (sh, js, yml …) – registriert ist.
   Danach stehen Bibliothek, Färben und Färben einer Zeichenkette (`code`) unter
   `skr.highlight` bereit, und das
   Ereignis `skr-highlight-ready` geht an das Dokument.

   Eine eigene Datei, kein Skript im Dokument: Die Seiten kommen ohne
   `unsafe-inline` in einer Content Security Policy aus.
   ============================================================================= */
const _script = document.querySelector("script[data-skr-highlight]");
const _hlBase = new URL("skriptorium/hljs/", window.skr._root()).href;
let _hlLanguages = [];
try { _hlLanguages = JSON.parse((_script && _script.getAttribute("data-skr-highlight")) || "[]"); } catch (e) { _hlLanguages = []; }
Promise.all([import(_hlBase + "core.min.js"), ..._hlLanguages.map((s) => import(_hlBase + s + ".min.js"))])
  .then(([core, ...grammars]) => {
    const hljs = core.default;
    _hlLanguages.forEach((s, i) => hljs.registerLanguage(s, grammars[i].default));
    const _language = (el) => (Array.from(el.classList).find((k) => k.startsWith("language-")) || "").slice(9);
    const _escaped = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
    const _in = (text, language) => (hljs.getLanguage(language) ? hljs.highlight(text, { language: language, ignoreIllegals: true }).value : _escaped(text));
    /* Markdown: das Front Matter als YAML, jeder Codeblock darin in seiner Sprache, wenn die
       Unterlage sie lädt, sonst einfarbig (skriptorium#467). Die Grammatik der Bibliothek färbt
       beides nur einfarbig und hielte die letzte Zeile des Front Matter vor `---` für eine
       Überschrift; sie färbt nur den Text dazwischen. */
    const _FENCE = /^ {0,3}(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)^ {0,3}\1[`~]*[ \t]*$/gm;
    const _isMarkdown = (language) => (hljs.getLanguage(language) || {}).name === "Markdown";
    const _markdown = (text) => {
      let out = "";
      let rest = text;
      const head = rest.match(/^---[ \t]*\n(?:([\s\S]*?)\n)?---[ \t]*(?=\n|$)/);
      if (head) {
        out += '<span class="hljs-meta">---</span>\n' + (head[1] !== undefined ? _in(head[1], "yaml") + "\n" : "") + '<span class="hljs-meta">---</span>';
        rest = rest.slice(head[0].length);
      }
      let pos = 0;
      for (const m of rest.matchAll(_FENCE)) {
        out += _in(rest.slice(pos, m.index), "markdown");
        const open = m[0].slice(0, m[0].indexOf("\n") + 1);
        const close = m[0].slice(open.length + m[3].length);
        const language = m[2].trim().split(/\s+/)[0];
        out += '<span class="hljs-code">' + _escaped(open) + (_isMarkdown(language) ? _markdown(m[3]) : _in(m[3], language)) + _escaped(close) + "</span>";
        pos = m.index + m[0].length;
      }
      return out + _in(rest.slice(pos), "markdown");
    };
    const _colorize = (root) => (root || document)
      .querySelectorAll('pre code[class*="language-"]')
      .forEach((el) => {
        if (el.dataset.highlighted || !hljs.getLanguage(_language(el))) return;
        if (!_isMarkdown(_language(el))) { hljs.highlightElement(el); return; }
        el.innerHTML = _markdown(el.textContent);
        el.classList.add("hljs");
        el.dataset.highlighted = "yes";
      });
    /* Eine Zeichenkette färben, ohne Element – etwa Zeile für Zeile in einer
       Visualisierung: HTML mit den Klassen der Hervorhebung, der Text maskiert. Eine
       Sprache, die die Unterlage nicht lädt, kommt nur maskiert zurück. */
    const _code = (text, language) => {
      const t = String(text == null ? "" : text);
      if (!language || !hljs.getLanguage(language)) return _escaped(t);
      return _isMarkdown(language) ? _markdown(t) : _in(t, language);
    };
    _colorize(document);
    if (window.skr && !window.skr.highlight) Object.defineProperty(window.skr, "highlight", { value: Object.freeze({ hljs, apply: _colorize, code: _code, languages: _hlLanguages.slice() }), enumerable: true });
    document.dispatchEvent(new CustomEvent("skr-highlight-ready"));
    document.querySelectorAll("pre code.language-http .hljs-number").forEach((el) => {
      const code = parseInt(el.textContent, 10);
      if (code >= 100 && code <= 599) {
        el.classList.add("skr-http-status--" + Math.floor(code / 100) + "xx");
      }
    });
  });
