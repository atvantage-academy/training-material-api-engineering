/* Skript der Seite 07-openapi/anatomie.md – über `scripts:` im Front Matter geladen. */
(function () {
  "use strict";

  var BLOECKE = [
    { id: "openapi", zeilen: ["openapi: 3.1.0"],
      titel: "openapi",
      text: "Die Version der <strong>Spezifikation</strong> – nicht die Deiner API. Sie steht immer ganz oben und entscheidet, wie ein Werkzeug den Rest liest.",
      merke: "Verwechselt wird sie regelmäßig mit <code>info.version</code>. Die eine sagt, nach welchen Regeln das Dokument geschrieben ist; die andere, welchen Stand Deine Schnittstelle hat." },

    { id: "info", zeilen: ["info:", "  title: Account Service API", "  description: Verwaltung der Kundenkonten", "  version: 1.0.0"],
      titel: "info",
      text: "Wer bist Du, und welcher Stand ist das? <code>title</code> und <code>version</code> sind Pflicht – alles andere darf fehlen.",
      merke: "<strong>version</strong> ist die Version <strong>Deiner API</strong>. Sie gehört gepflegt: Sie ist die einzige Stelle, an der ein Aufrufer sieht, ob sich etwas geändert hat." },

    { id: "servers", zeilen: ["servers:", "  - url: https://api.example.com/v1"],
      titel: "servers",
      text: "Unter welchen Adressen ist die API erreichbar? Mehrere Einträge sind üblich – Produktion, Testumgebung, lokale Entwicklung.",
      merke: "Fehlt der Abschnitt, nehmen Werkzeuge an, die API liege unter derselben Adresse wie das Dokument. Für die Probierfunktion einer Oberfläche ist das meist falsch." },

    { id: "tags", zeilen: ["tags:", "  - name: customers", "    description: Kundenkonten verwalten"],
      titel: "tags",
      text: "Gruppiert die Operationen. Jede Operation verweist über ihr eigenes <code>tags</code>-Feld hierher.",
      merke: "Optisch die günstigste Verbesserung überhaupt: Ohne Tags stehen in der Oberfläche alle Operationen in einer langen Liste; mit Tags entstehen aufklappbare Kapitel." },

    { id: "paths", zeilen: ["paths:"],
      titel: "paths",
      text: "Hier beginnt das eigentliche Angebot: <strong>was die API kann</strong>. Darunter steht je eine Adresse – und unter jeder Adresse die Methoden, die dort erlaubt sind.",
      merke: "Was <em>nicht</em> hier steht, gibt es nicht. Eine Operation ohne Eintrag ist für jeden Aufrufer unsichtbar – und für ein Gateway, das sich daraus konfiguriert, auch." },

    { id: "pfad-liste", zeilen: ["  /customers:"],
      titel: "Eine Adresse (Listenressource)",
      text: "Der Pfad, relativ zu <code>servers.url</code>. Darunter folgen die Methoden – hier <code>get</code> und <code>post</code>.",
      merke: "Der Pfad enthält keine Dateiendung und kein Format. Worin die Daten kommen, regelt <code>content</code> weiter unten." },

    { id: "get-liste", zeilen: ["    get:", "      tags: [customers]", "      operationId: readCustomers", "      summary: Alle Kunden lesen", "      parameters:", "        - name: state", "          in: query", "          schema:", "            $ref: '#/components/schemas/CustomerState'"],
      titel: "Eine Operation mit Query-Parameter",
      text: "<code>operationId</code> ist der eindeutige, stabile Name der Operation – und für ein <strong>API Gateway</strong>, das sich aus dem Dokument konfiguriert, ihr Schlüssel: Daran hängen Richtlinien, Rate Limits und Metriken. Wer ihn umbenennt, verliert dort diese Zuordnung.<code>summary</code> ist der Satz, den ein Mensch in der Oberfläche liest. <code>parameters</code> beschreibt alles, was nicht im Body steht – <code>in: query</code> für Filter, <code>in: path</code> für Platzhalter, <code>in: header</code> für Header.",
      merke: "Auch ein Parameter kann per <code>$ref</code> auf eine gemeinsame Definition zeigen. Ab der zweiten Verwendung lohnt sich das." },

    { id: "get-antwort", zeilen: ["      responses:", "        '200':", "          description: Die Liste der Kunden", "          content:", "            application/json:", "              schema:", "                $ref: '#/components/schemas/CustomersList'", "        '400':", "          description: Der Filter ist ungültig"],
      titel: "Die Antwort – sieben Ebenen tief",
      text: "Hier steckt die Verschachtelung, über die alle stolpern: <code>responses</code> → Statuscode → <code>content</code> → Medientyp → <code>schema</code>. Jede Ebene beantwortet eine eigene Frage. Auch ein Lesezugriff kann scheitern: Ein Filterwert außerhalb von <code>CustomerState</code> endet mit <code>400</code>.",
      merke: "Die Anführungszeichen um <code>'200'</code> sind kein Zufall: Ohne sie liest YAML eine Zahl, gefordert ist ein Textschlüssel. <strong>Der häufigste Anfängerfehler.</strong>" },

    { id: "post", zeilen: ["    post:", "      tags: [customers]", "      operationId: createCustomer", "      summary: Einen Kunden anlegen", "      requestBody:", "        required: true", "        content:", "          application/json:", "            schema:", "              $ref: '#/components/schemas/Customer'", "      responses:", "        '201':", "          description: Kunde wurde angelegt", "          headers:", "            Location:", "              description: Adresse des neuen Kunden", "              schema: { type: string }", "        '400':", "          description: Die Daten sind nicht gültig"],
      titel: "Eine schreibende Operation",
      text: "Neu ist <code>requestBody</code> – was der Client mitschickt. Und die Antworten werden interessanter: <code>201</code> mit einem <code>Location</code>-Header auf das Neue, <code>400</code> für ungültige Daten.",
      merke: "<strong>Die Fehlerfälle sind der Teil, den alle weglassen</strong> – und genau der, an dem die Integration später scheitert. Ein Aufrufer muss wissen, womit er rechnen muss." },

    { id: "pfad-einzeln", zeilen: ["  /customers/{id}:", "    parameters:", "      - $ref: '#/components/parameters/customerId'"],
      titel: "Eine Adresse mit Platzhalter",
      text: "Der geschweifte Teil ist ein Platzhalter und <strong>muss</strong> als Parameter deklariert sein. Steht die Deklaration hier – auf Pfadebene statt in der Operation –, gilt sie für <em>alle</em> Methoden darunter.",
      merke: "Genau dafür ist die Pfadebene da: <code>id</code> sieht bei <code>get</code>, <code>put</code>, <code>patch</code> und <code>delete</code> gleich aus. Einmal schreiben statt viermal." },

    { id: "get-einzeln", zeilen: ["    get:", "      tags: [customers]", "      operationId: readCustomer", "      summary: Einen Kunden lesen", "      responses:", "        '200':", "          description: Der Kunde wurde gefunden", "          content:", "            application/json:", "              schema:", "                $ref: '#/components/schemas/Customer'", "        '404':", "          description: Diesen Kunden gibt es nicht"],
      titel: "Lesen eines einzelnen Kunden",
      text: "Derselbe Aufbau wie oben – nur liefert das Schema jetzt ein Objekt statt einer Liste. Und es gibt einen Fall mehr: Die ID kann ins Leere zeigen.",
      merke: "Ein <code>404</code> ist keine Ausnahme, sondern ein normaler Ausgang. Wer ihn weglässt, zwingt den Aufrufer zum Raten." },

    { id: "delete", zeilen: ["    delete:", "      tags: [customers]", "      operationId: deleteCustomer", "      summary: Einen Kunden löschen", "      responses:", "        '204':", "          description: Gelöscht – kein Inhalt", "        '404':", "          description: Diesen Kunden gibt es nicht"],
      titel: "Löschen",
      text: "<code>204</code> heißt: erledigt, und es gibt nichts zurückzugeben. Deshalb steht hier <strong>kein</strong> <code>content</code>.",
      merke: "Ein <code>204</code> mit Body ist ein Widerspruch – der Code sagt gerade, dass keiner kommt. Manche Werkzeuge melden das, andere nicht." },

    { id: "components", zeilen: ["components:"],
      titel: "components",
      text: "Die dritte Frage: <strong>woraus bestehen die Daten?</strong> Alles, was mehrfach vorkommt, wird hier einmal definiert und oben referenziert – Schemas, Parameter, Antworten, Header.",
      merke: "Der Nutzen ist nicht Tippersparnis, sondern <strong>eine Wahrheit</strong>: Ein Kunde sieht beim Lesen und beim Schreiben gleich aus, weil es derselbe Eintrag ist." },

    { id: "schema", zeilen: ["  schemas:", "    Customer:", "      type: object", "      required: [name, birthdate]", "      properties:", "        id:", "          type: string", "          format: uuid", "          readOnly: true", "        name:", "          type: string", "          minLength: 3", "          maxLength: 100", "          examples: [Tom Mayer]", "        birthdate:", "          type: string", "          format: date", "        state:", "          $ref: '#/components/schemas/CustomerState'", "          readOnly: true"],
      titel: "Ein Schema",
      text: "Die Struktur eines Datensatzes: welche Felder es gibt, welchen Typ sie haben, welche Pflicht sind und welche Grenzen gelten. Das ist gewöhnliches JSON Schema.",
      merke: "<code>readOnly: true</code> löst die Frage, an der viele Entwürfe hängen: ID und Zustand kommen beim Lesen mit, werden beim Anlegen aber nicht geschickt. <strong>Damit braucht es kein zweites Schema.</strong>" },

    { id: "zustand-schema", zeilen: ["    CustomerState:", "      type: string", "      enum: [aktiv, deaktiviert, gesperrt]"],
      titel: "Ein Aufzählungstyp",
      text: "<code>enum</code> legt die erlaubten Werte abschließend fest. Als eigenes Schema lässt sich der Typ an mehreren Stellen nutzen – hier im Feld <code>state</code> des Kunden und im Filter von <code>GET /customers</code>.",
      merke: "Ab OpenAPI 3.1 darf neben einem <code>$ref</code> noch etwas stehen – hier <code>readOnly: true</code> am Feld <code>state</code>. In 3.0 wurde alles neben <code>$ref</code> ignoriert." },

    { id: "liste-schema", zeilen: ["    CustomersList:", "      type: object", "      properties:", "        items:", "          type: array", "          items:", "            $ref: '#/components/schemas/Customer'"],
      titel: "Eine Listenantwort als Objekt",
      text: "Die Liste steht in einem Feld eines Objekts – nicht als nacktes Array auf oberster Ebene.",
      merke: "<strong>Das ist Absicht und eine der nützlichsten Gewohnheiten überhaupt.</strong> Ein Objekt kann später um Seitenangaben, Gesamtzahl oder Verweise wachsen, ohne dass ein einziger Aufrufer bricht. Ein Array kann das nicht." },

    { id: "parameter", zeilen: ["  parameters:", "    customerId:", "      name: id", "      in: path", "      required: true", "      schema:", "        type: string", "        format: uuid"],
      titel: "Ein wiederverwendbarer Parameter",
      text: "Einmal definiert, von jedem Pfad referenzierbar. Bei <code>in: path</code> ist <code>required: true</code> Pflicht – ein Platzhalter kann nicht optional sein.",
      merke: "Genau solche Kleinigkeiten sind der Grund, warum erzeugte Dokumente oft unschön aussehen: Ein Generator schreibt denselben Parameter an jede Operation, statt ihn einmal zu definieren." }
  ];

  var wurzel = document.querySelector(".an");
  if (!wurzel) return;
  var code = wurzel.querySelector("[data-an-code]");
  var panel = wurzel.querySelector("[data-an-panel]");
  var bloecke = {};

  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function faerbe(zeile) {
    var t = esc(zeile);
    // Schlüssel am Zeilenanfang hervorheben (alles vor dem ersten Doppelpunkt).
    return t.replace(/^(\s*-?\s*)([A-Za-z0-9_$'{}\/\[\]{}.\-]+)(:)/, function (_, pre, key, dp) {
      return pre + '<span class="an__k">' + key + "</span>" + dp;
    });
  }

  BLOECKE.forEach(function (b) {
    var el = document.createElement("span");
    el.className = "an__block";
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", b.titel + " – erklären");
    el.innerHTML = b.zeilen.map(function (z) {
      return '<span class="an__zeile">' + (faerbe(z) || "&nbsp;") + "</span>";
    }).join("");
    el.addEventListener("click", function () { zeige(b, el); merken(); });
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); zeige(b, el); merken(); }
    });
    bloecke[b.id] = el;
    code.appendChild(el);
  });

  var aktiv = "";

  function zeige(b, el) {
    Array.prototype.forEach.call(code.children, function (k) { k.classList.remove("is-aktiv"); });
    el.classList.add("is-aktiv");
    aktiv = b.id;
    panel.innerHTML = "<h3>" + b.titel + "</h3><p>" + b.text + "</p>" +
      (b.merke ? '<p class="an__merke">' + b.merke + "</p>" : "");
  }

  wurzel.querySelectorAll("[data-an-jump]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var ziel = bloecke[tab.getAttribute("data-an-jump")] || bloecke.openapi;
      var b = BLOECKE.filter(function (x) { return bloecke[x.id] === ziel; })[0];
      ziel.scrollIntoView({ block: "nearest", behavior: "smooth" });
      zeige(b, ziel);
      merken();
    });
  });

  /* --- Zustand in der Adresse ---------------------------------------------
     DER ERKLAERTE BLOCK GEHOERT IN DIE ADRESSE: Das Regiebuch verweist auf die
     Stelle, an der die siebenfache Verschachtelung der Antwort steht, nicht auf
     „irgendwo in diesem Dokument".

     Ueber `skr.state` des Skriptoriums - es gibt nur EIN Fragment je
     Seite, und wer allein hineinschreibt, loescht den Zustand der uebrigen
     Bausteine. Die Anmeldung wartet auf DOMContentLoaded, weil das Theme-Skript
     `defer` traegt und damit erst nach diesem Inline-Skript laeuft. */
  function merken() { if (window.skr && window.skr.state) { window.skr.state.update(); } }

  function anmelden() {
    if (!(window.skr && window.skr.state)) { return; }
    window.skr.state.register({
      key: "block",
      read: function () { return aktiv; },
      apply: function (wert) {
        var el = bloecke[wert];
        if (!el) { return; }
        var b = BLOECKE.filter(function (x) { return x.id === wert; })[0];
        if (b) { zeige(b, el); }
      }
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", anmelden);
  } else {
    anmelden();
  }
})();
