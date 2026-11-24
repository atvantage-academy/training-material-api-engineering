/* Skript der Seite 13-api-security/api-security.md – über `scripts:` im Front Matter geladen. */
(function () {
  "use strict";

  function Z() { return Array.prototype.join.call(arguments, "\n"); }

  var TOM = "Authorization: Bearer eyJhbGciOi…   (Tom Mayer, reader_access)";

  /* ------------------------------------------------------------------ Daten
     Je Anfrage: wer sie aufhält (halt), wer dazu beiträgt (mit) und welche
     Prüfung sie passiert (durch). Die Kennungen sind die `data-pruefung` der
     Seite. NUR EINGEHENDE ANFRAGEN – API10 (der Service als Aufrufer) gehört
     nicht hierher, sondern nur in die Karte. */

  var ANFRAGEN = {
    api1: {
      titel: "Tom Mayer liest einen fremden Kunden",
      risiko: "api1",
      durch: ["g-token", "g-scope", "g-schema"], halt: ["s-objekt"], mit: [],
      anfrage: Z("GET /customers/9b2e4c1a-0d3f-4c55-8a1e-2f5b6c7d77f0 HTTP/1.1", TOM),
      antwort: Z("HTTP/1.1 404 Not Found",
                 "Content-Type: application/problem+json", "",
                 '{ "title": "Kunde nicht gefunden", "status": 404 }'),
      text: "Das Gateway sieht ein gültiges Token mit passendem Scope und eine Anfrage, die zum Vertrag passt – und <strong>lässt durch</strong>. " +
            "Ob dieser Kunde zu Tom Mayer gehört, weiß nur der Service. " +
            "Angenommen ist eine Self-Service-App, in der Kund:innen ihre eigenen Daten abrufen."
    },
    api2: {
      titel: "Ein abgelaufenes Token",
      risiko: "api2",
      durch: [], halt: ["g-token"], mit: [],
      anfrage: Z("GET /customers HTTP/1.1",
                 "Authorization: Bearer eyJhbGciOi…   (abgelaufen vor 2 Stunden)"),
      antwort: Z("HTTP/1.1 401 Unauthorized",
                 'WWW-Authenticate: Bearer error="invalid_token",',
                 '  error_description="The access token expired"'),
      text: "Das Gateway prüft das Token, bevor irgendein Service etwas davon merkt. " +
            "<code>401</code>: Mit einem neuen Token kann derselbe Aufruf gelingen."
    },
    api3: {
      titel: "Ein gesperrter Kunde setzt seinen Zustand selbst",
      risiko: "api3",
      durch: ["g-token", "g-scope"], halt: ["s-feld"], mit: ["g-schema"],
      anfrage: Z("PATCH /customers/3fa85f64-5717-4562-b3fc-2c963f66afa6 HTTP/1.1",
                 "Authorization: Bearer …   (writer_access)",
                 "Content-Type: application/json", "",
                 '{ "name": "Tom Mayer", "state": "active" }'),
      antwort: Z("HTTP/1.1 400 Bad Request",
                 "Content-Type: application/problem+json", "",
                 '{ "title": "Feld nicht änderbar",',
                 '  "errors": [ { "field": "state",',
                 '                "detail": "readOnly" } ] }'),
      text: "Methode, Adresse und Scope stimmen – das Problem steckt in <em>einem Feld</em> des Bodys. " +
            "Das Gateway fängt es ab, <strong>wenn</strong> der Vertrag unbekannte Felder verbietet " +
            "(<code>additionalProperties: false</code>). Sonst bleibt es beim Service, der weiß, welche Felder nur er setzt."
    },
    api4: {
      titel: "Eine Million Kunden auf einmal",
      risiko: "api4",
      durch: ["g-token", "g-scope"], halt: ["g-schema"], mit: ["s-grenzen"],
      anfrage: Z("GET /customers?limit=1000000 HTTP/1.1", TOM),
      antwort: Z("HTTP/1.1 400 Bad Request",
                 "Content-Type: application/problem+json", "",
                 '{ "title": "Ungültiger Parameter",',
                 '  "errors": [ { "field": "limit",',
                 '                "detail": "höchstens 200" } ] }'),
      text: "Der Vertrag sagt <code>maximum: 200</code>. Das Gateway prüft die Anfrage dagegen und weist sie ab, " +
            "bevor der Service auch nur eine Zeile liest. Der Service hält dieselbe Grenze trotzdem ein – " +
            "für Aufrufe, die nicht über das Gateway kommen."
    },
    flut: {
      titel: "600 Anfragen pro Sekunde von einem Client",
      risiko: "api4",
      durch: ["g-token"], halt: ["g-rate"], mit: [],
      anfrage: Z("GET /customers?cursor=… HTTP/1.1", TOM,
                 "(die 601. Anfrage in dieser Sekunde)"),
      antwort: Z("HTTP/1.1 429 Too Many Requests",
                 "Retry-After: 30",
                 "Content-Type: application/problem+json", "",
                 '{ "title": "Zu viele Anfragen", "status": 429 }'),
      text: "Rate Limiting ist die klassische Gateway-Aufgabe: Es zählt je Aufrufer, ohne den Inhalt zu kennen. " +
            "<code>Retry-After</code> sagt dem Client, wann er es wieder versuchen darf."
    },
    api5: {
      titel: "Der Kundenservice sperrt ein Konto",
      risiko: "api5",
      durch: ["g-token"], halt: ["g-scope"], mit: [],
      anfrage: Z("POST /customers/3fa85f64-…/status-actions/lock HTTP/1.1",
                 "Authorization: Bearer …   (writer_access)",
                 "Content-Type: application/json", "",
                 '{ "reason": "Zahlungsrückstand" }'),
      antwort: Z("HTTP/1.1 403 Forbidden",
                 "Content-Type: application/problem+json", "",
                 '{ "title": "Berechtigung fehlt",',
                 '  "detail": "Erfordert lock_access", "status": 403 }'),
      text: "Die Sperre hat eine <em>eigene Adresse</em>, und der Vertrag verlangt dort <code>lock_access</code>. " +
            "Deshalb kann das Gateway entscheiden, ohne den Body zu lesen. <code>403</code>: Mit diesem Token hilft kein zweiter Versuch."
    },
    api6: {
      titel: "Gutschein-Jagd: 10.000 Neukonten per Skript",
      risiko: "api6",
      durch: ["g-token", "g-scope", "g-schema", "g-rate", "s-feld"], halt: ["s-fachlich"], mit: [],
      anfrage: Z("POST /customers HTTP/1.1",
                 "Content-Type: application/json", "",
                 '{ "name": "Kim Neu 4711", "birthdate": "1990-01-01" }',
                 "",
                 "(alle 4 Sekunden ein neues Konto, zehn Stunden lang –",
                 " jedes bekommt 10 € Neukunden-Gutschein)"),
      antwort: Z("HTTP/1.1 409 Conflict",
                 "Content-Type: application/problem+json", "",
                 '{ "title": "Für diese Zahlungsart besteht',
                 '   bereits ein Konto", "status": 409 }'),
      text: "Jede einzelne Anfrage ist korrekt, passt zum Vertrag und bleibt unter dem Rate Limit – für das Gateway ist alles in Ordnung. " +
            "Der Schaden entsteht erst in der Summe: 10.000 Gutscheine. Aufhalten kann das nur eine <strong>fachliche</strong> Regel, " +
            "etwa „ein Gutschein je Zahlungsmittel“ – und die muss die Fachseite benennen."
    },
    api7: {
      titel: "Ein Profilbild von einer fremden Adresse",
      risiko: "api7",
      durch: ["g-token", "g-scope"], halt: ["s-ausgehend"], mit: ["g-schema"],
      anfrage: Z("POST /customers/3fa85f64-…/avatar HTTP/1.1",
                 "Authorization: Bearer …   (writer_access)",
                 "Content-Type: application/json", "",
                 '{ "imageUrl": "https://bild.example.net/tom.png" }',
                 "",
                 "(der Name bild.example.net zeigt auf 169.254.169.254 –",
                 " die Adresse, unter der die Cloud ihre Zugangsschlüssel ausgibt)"),
      antwort: Z("HTTP/1.1 400 Bad Request",
                 "Content-Type: application/problem+json", "",
                 '{ "title": "Bildquelle nicht erlaubt", "status": 400 }'),
      text: "Der Service soll das Bild selbst herunterladen – und zwar von <em>innen</em>, wo er Dinge erreicht, die von außen gesperrt sind. " +
            "Das Gateway sieht nur eine harmlose <code>https</code>-Adresse im Body; der Vertrag kann die Form prüfen, nicht das Ziel. " +
            "Erst beim Abruf zeigt sich, wohin die Adresse wirklich führt – deshalb hält der Service auf."
    },
    api8: {
      titel: "Ein kaputter Cursor",
      risiko: "api8",
      durch: ["g-token", "g-scope", "g-schema"], halt: ["s-fehler"], mit: ["g-konfig"],
      anfrage: Z("GET /customers?cursor=x%27%3B-- HTTP/1.1", TOM),
      antwort: Z("HTTP/1.1 400 Bad Request",
                 "Content-Type: application/problem+json", "",
                 '{ "title": "Ungültiger Cursor",',
                 '  "detail": "Bitte die Liste von vorn laden.",',
                 '  "status": 400 }'),
      text: "Der Cursor ist für den Vertrag nur eine Zeichenkette – das Gateway lässt ihn durch. " +
            "Der Service antwortet nicht mit <code>500</code>, Stacktrace und SQL, sondern im vereinbarten Format, ohne Innenleben."
    },
    api9: {
      titel: "Jemand findet die alte Version",
      risiko: "api9",
      durch: [], halt: ["g-routing"], mit: [],
      anfrage: Z("GET /v0/customers?limit=1000000 HTTP/1.1",
                 "(ohne Token – v0 kannte noch keins)"),
      antwort: Z("HTTP/1.1 410 Gone",
                 "Content-Type: application/problem+json", "",
                 '{ "title": "Version abgeschaltet",',
                 '  "detail": "Bitte /v1 verwenden.", "status": 410 }'),
      text: "Hätte <code>v0</code> noch geantwortet, wären alle neuen Prüfungen umgangen. " +
            "Das Gateway macht nur erreichbar, was im Inventar steht."
    }
  };

  var NAMEN = { gateway: "das Gateway", service: "der Service" };

  /* ------------------------------------------------------ Wer hält das auf? */

  var wurzel = document.querySelector(".as");
  var karte = document.querySelector("[data-as-karte]");
  var panel = document.querySelector("[data-as-panel]");
  if (!wurzel || !karte || !panel) return;

  var gewählt = "";
  var risiko = "";
  var filter = "alle";

  var leer = wurzel.querySelector("[data-as-leer]");
  var inhalt = wurzel.querySelector("[data-as-inhalt]");
  var risikoKnopf = wurzel.querySelector("[data-as-risiko-knopf]");

  function zeichneAnfrage() {
    var a = ANFRAGEN[gewählt];
    wurzel.classList.toggle("hat-anfrage", !!a);
    wurzel.querySelectorAll("[data-anfrage]").forEach(function (b) {
      var an = b.dataset.anfrage === gewählt;
      b.classList.toggle("is-aktiv", an);
      b.setAttribute("aria-pressed", an ? "true" : "false");
    });
    wurzel.querySelectorAll("[data-pruefung]").forEach(function (li) {
      var id = li.dataset.pruefung;
      li.classList.toggle("is-halt", !!a && a.halt.indexOf(id) >= 0);
      li.classList.toggle("is-mit", !!a && a.mit.indexOf(id) >= 0);
      li.classList.toggle("is-durch", !!a && a.durch.indexOf(id) >= 0);
    });
    leer.hidden = !!a;
    inhalt.hidden = !a;
    if (!a) return;
    inhalt.querySelector("[data-as-titel]").textContent = a.titel;
    inhalt.querySelector("[data-as-anfrage]").textContent = a.anfrage;
    inhalt.querySelector("[data-as-antwort]").textContent = a.antwort;
    inhalt.querySelector("[data-as-text]").innerHTML = a.text;
    risikoKnopf.textContent = "Zu " + a.risiko.toUpperCase() + " in der Karte";
  }

  /* ------------------------------------------------------------------ Karte */

  var knoten = Array.prototype.slice.call(karte.querySelectorAll("[data-risiko]"));
  var leerPanel = panel.querySelector("[data-as-panel-leer]");

  function zeichneRisiko() {
    knoten.forEach(function (k) {
      var an = k.dataset.risiko === risiko;
      k.classList.toggle("is-aktiv", an);
      k.setAttribute("aria-pressed", an ? "true" : "false");
    });
    panel.querySelectorAll("[data-risiko-inhalt]").forEach(function (r) {
      r.hidden = r.dataset.risikoInhalt !== risiko;
    });
    leerPanel.hidden = !!risiko;
    zeichneLinien();
  }

  /* DER FILTER DIMMT, ER VERSTECKT NICHT. Die Aussage ist das Verhältnis –
     „an so vielen ist das Gateway beteiligt“ –, und die sieht man nur, wenn
     die übrigen Knoten sichtbar bleiben. */
  function zeichneFilter() {
    var treffer = 0;
    knoten.forEach(function (k) {
      var an = filter === "alle" || k.dataset.wo.split(/\s+/).indexOf(filter) >= 0;
      if (an) treffer++;
      k.classList.toggle("is-gedimmt", !an);
    });
    document.querySelectorAll("[data-filter]").forEach(function (b) {
      var an = b.dataset.filter === filter;
      b.classList.toggle("is-aktiv", an);
      b.setAttribute("aria-pressed", an ? "true" : "false");
    });
    var zahl = document.querySelector("[data-as-zahl]");
    if (zahl) {
      zahl.textContent = filter === "alle" ? "" :
        "An " + treffer + " von " + knoten.length + " Risiken ist " + NAMEN[filter] + " beteiligt.";
    }
    zeichneLinien();
  }

  /* DIE ÄSTE WERDEN GEZEICHNET, NICHT GESETZT: Ihre Enden hängen an der
     Lage der Knoten, und die ändert sich mit Breite und Schrift. Schmal steht
     die Karte als Liste – dann blendet das Stylesheet die Äste aus, und hier
     gibt es nichts zu tun. */
  var linien = karte.querySelector("[data-as-linien]");
  var mitte = karte.querySelector("[data-as-mitte]");
  var SVG = "http://www.w3.org/2000/svg";

  function zeichneLinien() {
    while (linien.firstChild) { linien.removeChild(linien.firstChild); }
    if (getComputedStyle(linien).display === "none") return;
    var k = karte.getBoundingClientRect();
    var m = mitte.getBoundingClientRect();
    linien.setAttribute("viewBox", "0 0 " + k.width + " " + k.height);
    var my = m.top + m.height / 2 - k.top;
    knoten.forEach(function (n) {
      var r = n.getBoundingClientRect();
      var links = r.left + r.width / 2 < m.left + m.width / 2;
      var x1 = (links ? m.left : m.right) - k.left;
      var x2 = (links ? r.right : r.left) - k.left;
      var y2 = r.top + r.height / 2 - k.top;
      var dx = (x2 - x1) / 2;
      var pfad = document.createElementNS(SVG, "path");
      pfad.setAttribute("d", "M" + x1 + "," + my + " C" + (x1 + dx) + "," + my + " " + (x2 - dx) + "," + y2 + " " + x2 + "," + y2);
      pfad.setAttribute("class", "as-karte__linie" +
        (n.classList.contains("is-aktiv") ? " is-aktiv" : "") +
        (n.classList.contains("is-gedimmt") ? " is-gedimmt" : ""));
      linien.appendChild(pfad);
    });
  }

  if (window.ResizeObserver) {
    new ResizeObserver(zeichneLinien).observe(karte);
  } else {
    window.addEventListener("resize", zeichneLinien);
  }

  /* -------------------------------------------------------------- Bedienung */

  function zeigeRisiko(r, springen) {
    risiko = r;
    zeichneRisiko();
    merken();
    if (springen) {
      var ziel = document.getElementById("owasp");
      if (ziel) ziel.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-anfrage]");
    if (b) {
      gewählt = (gewählt === b.dataset.anfrage) ? "" : b.dataset.anfrage;
      zeichneAnfrage(); merken();
      return;
    }
    if (e.target.closest("[data-as-risiko-knopf]") && ANFRAGEN[gewählt]) {
      zeigeRisiko(ANFRAGEN[gewählt].risiko, true);
      return;
    }
    var k = e.target.closest(".as-karte__knoten");
    if (k) {
      zeigeRisiko(risiko === k.dataset.risiko ? "" : k.dataset.risiko, false);
      return;
    }
    var f = e.target.closest("[data-filter]");
    if (f) { filter = f.dataset.filter; zeichneFilter(); merken(); }
  });

  /* --- Zustand in der Adresse ---------------------------------------------
     Gewählte Anfrage, gewähltes Risiko und Filter sind das, worauf das
     Trainer-Thema zeigt. Angemeldet bei `skr.state` statt selbst ins Fragment
     zu schreiben – wie in vier-stile.js. Erst bei DOMContentLoaded, weil das
     Theme-Skript danach läuft. */
  function merken() { if (window.skr && window.skr.state) { window.skr.state.update(); } }

  function anmelden() {
    if (!(window.skr && window.skr.state)) { return; }
    window.skr.state.register({
      key: "anfrage",
      read: function () { return gewählt; },
      apply: function (wert) {
        if (wert !== "" && !ANFRAGEN[wert]) { return; }
        gewählt = wert; zeichneAnfrage();
      }
    });
    window.skr.state.register({
      key: "risiko",
      read: function () { return risiko; },
      apply: function (wert) {
        if (wert !== "" && !karte.querySelector('[data-risiko="' + wert.replace(/[^a-z0-9]/gi, "") + '"]')) { return; }
        risiko = wert; zeichneRisiko();
      }
    });
    window.skr.state.register({
      key: "filter",
      read: function () { return filter === "alle" ? "" : filter; },
      apply: function (wert) {
        if (wert !== "" && !NAMEN[wert]) { return; }
        filter = wert || "alle"; zeichneFilter();
      }
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", anmelden);
  } else {
    anmelden();
  }

  zeichneAnfrage();
  zeichneRisiko();
  zeichneFilter();
})();
