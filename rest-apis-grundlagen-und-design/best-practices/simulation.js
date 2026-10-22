/* Skript der Seite 09-best-practices/simulation.md – über `scripts:` im Front Matter geladen. */
(function () {
  "use strict";
  var sim = window.skr.ext.didaktikon.simulation;

  function zelle() {
    var el = document.createElement("div");
    el.className = "skr-didaktikon-simulation-cell";
    el.innerHTML = '<span class="skr-didaktikon-simulation-cell__label"></span>' +
                   '<span class="skr-didaktikon-simulation-cell__name"></span>' +
                   '<span class="skr-didaktikon-simulation-cell__value"></span>';
    return el;
  }

  /* Setzt die Laufanimation neu an. Eine CSS-Animation startet nicht erneut,
     solange die Klasse dranbleibt - erst Entfernen, Reflow, wieder Setzen. */
  function starteBahn(bahn, an, rueck) {
    if (!bahn) return;
    bahn.classList.remove("laeuft", "zurueck");
    if (!an) return;
    void bahn.offsetWidth;
    bahn.classList.add("laeuft");
    if (rueck) bahn.classList.add("zurueck");
  }

  function grenzzeile() {
    var el = document.createElement("div");
    el.className = "grenze";
    el.innerHTML = "<span></span>";
    return el;
  }

  function beschrifteGrenze(el, nr) {
    el.querySelector("span").textContent = "Seite " + nr + " │ Seite " + (nr + 1);
  }

  function fuelle(el, label, name, wert) {
    el.querySelector(".skr-didaktikon-simulation-cell__label").textContent = label;
    el.querySelector(".skr-didaktikon-simulation-cell__name").textContent = name;
    el.querySelector(".skr-didaktikon-simulation-cell__value").textContent = wert;
  }

  /* ============================================================ Szenario 1
     Ohne Paginierung – die Kette von links nach rechts.                    */

  var STATIONEN = ["client", "gateway", "service", "db"];

  function ketteStart() {
    return {
      client:  { wert: "–",         zustand: "wartet auf Antwort",        grenze: "verträgt ein paar tausend DOM-Knoten" },
      gateway: { wert: "–",         zustand: "leitet durch",              grenze: "Antwortpuffer 10 MB · Timeout 30 s" },
      service: { wert: "–",         zustand: "bereit",                    grenze: "Heap 512 MB" },
      db:      { wert: "1 200 000", zustand: "Bestellungen gespeichert",  grenze: "Ergebnismenge wird im Speicher gehalten" },
      laeuft:  null
    };
  }

  function zeichneStation(id, st, animated) {
    var ziel = document.getElementById("ohne-" + id);
    if (!ziel) return;
    var panel = ziel.closest(".skr-didaktikon-simulation-panel");
    if (panel) panel.classList.toggle("skr-didaktikon-simulation-panel--tone-alert", !!st.kaputt);

    /* Schlüssel ist NUR die Station: Der Kasten bleibt stehen und ändert
       seinen Inhalt. Ein Schlüssel mit dem Zustand darin würde ihn bei
       jedem Schritt neu anlegen – und die Spalte damit zum Springen bringen. */
    sim.list(ziel, [st], {
      animated: animated,
      key: function () { return id; },
      create: function () {
        var el = document.createElement("div");
        el.className = "st";
        el.innerHTML = '<p class="st__wert"></p>' +
                       '<div class="skr-didaktikon-simulation-cell"><span class="skr-didaktikon-simulation-cell__name"></span></div>' +
                       '<p class="st__grenze"></p>';
        return el;
      },
      update: function (el, x) {
        el.querySelector(".st__wert").textContent = x.wert;
        var kasten = el.querySelector(".skr-didaktikon-simulation-cell");
        var name = kasten.querySelector(".skr-didaktikon-simulation-cell__name");
        if (name.textContent !== x.zustand) {
          name.textContent = x.zustand;
          if (animated) sim.pulse(kasten);
        }
        kasten.classList.toggle("is-error", !!x.kaputt);
        kasten.classList.toggle("is-active", !!x.aktiv);
        el.querySelector(".st__grenze").textContent = x.grenze || "";
      }
    });
  }

  sim.registerScenario({
    id: "ohne",
    title: "Ohne Paginierung",
    description: "Ein GET auf die Liste, keine Obergrenze – und vier Stationen, die nacheinander umfallen.",
    state: ketteStart,
    render: function (s, ctx) {
      STATIONEN.forEach(function (id) { zeichneStation(id, s[id], ctx.animated); });
      starteBahn(document.getElementById("ohne-bahn"), ctx.animated && !!s.laeuft, s.laeuft === "her");
    },
    steps: [
      {
        title: "Die Ausgangslage",
        text: "<p>Ein Online-Shop, drei Jahre im Betrieb: <b>1,2 Millionen Bestellungen</b> in der Datenbank. Dazwischen liegen ein Service und ein Gateway, ganz links sitzt ein Browser.</p>" +
              "<p>Jede dieser vier Stationen hat eine Grenze – unten in jeder Tafel steht, welche.</p>",
        apply: function () {}
      },
      {
        title: "GET /orders – ohne alles",
        text: "<p>Der Aufruf ist vollkommen harmlos formuliert: <code>GET /orders</code>. <b>Keine Seite, kein Limit, keine Obergrenze.</b></p>" +
              "<p>Genau so steht er in den meisten APIs am ersten Tag – als es zehn Bestellungen waren, war daran auch nichts falsch.</p>",
        apply: function (s) {
          s.client.zustand = "GET /orders abgeschickt";
          s.client.aktiv = true;
          s.laeuft = "hin";
        }
      },
      {
        title: "Die Datenbank liefert alles",
        text: "<p><code>SELECT * FROM orders</code> – die Abfrage ist korrekt und der Index greift. Nur ist die Ergebnismenge eben <b>1,2 Millionen Zeilen</b>, rund 2 GB, und sie wird gehalten, bis der Service sie abgeholt hat.</p>" +
              "<p><b>Die Datenbank ist die erste Station, die es merkt</b> – und die einzige, die noch antwortet.</p>",
        apply: function (s) {
          s.client.aktiv = false;
          s.laeuft = null;
          s.db.zustand = "≈ 2 GB Ergebnismenge";
          s.db.kaputt = true;
        }
      },
      {
        title: "Der Service macht Objekte daraus",
        text: "<p>Aus jeder Zeile wird ein Objekt, aus jedem Objekt wird JSON. <b>512 MB Heap gegen 1,2 Millionen Objekte</b> – der Garbage Collector läuft durchgehend, und dann ist Schluss.</p>" +
              "<p>Der Ausfall trifft <b>nicht nur diesen einen Aufruf</b>: Der Service bedient währenddessen niemanden mehr.</p>",
        apply: function (s) {
          s.service.wert = "OutOfMemory";
          s.service.zustand = "Heap voll – Instanz weg";
          s.service.kaputt = true;
        }
      },
      {
        title: "Das Gateway gibt vorher auf",
        text: "<p>Das Gateway hat auf den Service gewartet und wartet weiter. Nach <b>30 Sekunden</b> bricht es ab und schickt dem Client, was es hat: einen <code>504 Gateway Timeout</code>.</p>" +
              "<p>Wäre die Antwort gekommen, hätte es sie auch nicht durchgelassen – <b>10 MB Puffer</b> gegen mehrere hundert MB JSON.</p>",
        apply: function (s) {
          s.gateway.wert = "504";
          s.gateway.zustand = "Timeout nach 30 s";
          s.laeuft = "her";
          s.gateway.kaputt = true;
        }
      },
      {
        title: "Und der Client hätte es auch nicht überlebt",
        text: "<p>Angenommen, alles davor hätte gehalten: Der Browser müsste mehrere hundert MB JSON <b>parsen</b> und daraus eine Liste bauen. Bei 1,2 Millionen Einträgen sind das Millionen DOM-Knoten.</p>" +
              "<p>Der Tab friert ein. <b>Kein Fehler, keine Meldung</b> – nur ein Fenster, das nicht mehr reagiert.</p>",
        apply: function (s) {
          s.laeuft = null;
          s.client.wert = "keine Reaktion";
          s.client.zustand = "Skript blockiert den Tab";
          s.client.kaputt = true;
        }
      },
      {
        title: "Vier Grenzen, keine davon in der API",
        text: "<p><b>Jede Station hat eine Obergrenze – nur die API hatte keine.</b> Wer sie nicht hineinschreibt, bekommt die Grenze der schwächsten Station, und zwar als Ausfall statt als Fehlermeldung.</p>" +
              "<p>Deshalb ist die Obergrenze <b>Sache des Servers</b>: Auch <code>?limit=1000000</code> muss er auf sein Maximum kürzen. Ein Limit, über das der Aufrufer allein entscheidet, ist keines.</p>",
        apply: function (s) {
          s.client.wert  = "40";  s.client.zustand  = "zwei Seiten à 20 gezeichnet";
          s.gateway.wert = "200"; s.gateway.zustand = "wenige KB durchgereicht";
          s.service.wert = "20";  s.service.zustand = "20 Objekte im Speicher";
          s.db.wert      = "20";  s.db.zustand      = "LIMIT 20 – Index reicht";
          STATIONEN.forEach(function (id) { s[id].kaputt = false; s[id].aktiv = true; });
        },
        duration: 6000
      }
    ]
  });

  /* ============================================================ Szenario 2+3
     Blättern: Client links, Leitung und der andere Client in der Mitte,
     Datenbestand rechts. Die Zahl der Zeilen ändert sich NIE.              */

  var SEITE = 2;

  function blaetternStart() {
    return {
      bestand: [
        { id: "B-106", betrag: "84,50 €" },
        { id: "B-105", betrag: "12,00 €" },
        { id: "B-104", betrag: "239,90 €" },
        { id: "B-103", betrag: "7,99 €" },
        { id: "B-102", betrag: "56,40 €" },
        { id: "B-101", betrag: "18,20 €" }
      ],
      /* Sechs feste Fächer – der Client füllt sie der Reihe nach auf. */
      client: [1, 2, 3, 4, 5, 6].map(function (n) { return { fach: "f" + n }; }),
      leitung: null,
      notiz: "",
      clientnotiz: "",
      frage: "",
      nebenbei: null,
      grenzen: false
    };
  }

  function lebende(s) { return s.bestand.filter(function (x) { return !x.geloescht; }); }

  function zeichneBlaettern(s, ctx) {
    var sz = ctx.scenario;

    document.getElementById(sz + "-zaehler").textContent =
      lebende(s).length + " Bestellungen" + (lebende(s).length < s.bestand.length ? " · 1 gelöscht" : "");
    document.getElementById(sz + "-zaehler-client").textContent =
      s.client.filter(function (f) { return f.id && !f.problem; }).length + " von 6 abgeholt";

    /* Einträge und Seitengrenzen in EINER Liste – die Grenzen haben feste
       Schlüssel und wandern beim Löschen mit, statt neu zu entstehen. */
    var posten = [], pos = 0;
    s.bestand.forEach(function (x) {
      if (!x.geloescht) pos++;
      posten.push({ art: "eintrag", key: x.id, x: x, pos: x.geloescht ? null : pos });
      if (s.grenzen && !x.geloescht && pos % SEITE === 0 && pos < s.bestand.length) {
        posten.push({ art: "grenze", key: "grenze-" + (pos / SEITE), nr: pos / SEITE });
      }
    });

    sim.list(document.getElementById(sz + "-bestand"), posten, {
      animated: ctx.animated,
      key: function (p) { return p.key; },
      create: function (p) { return p.art === "grenze" ? grenzzeile() : zelle(); },
      update: function (el, p) {
        if (p.art === "grenze") { beschrifteGrenze(el, p.nr); return; }
        fuelle(el, p.pos ? "Pos. " + p.pos : "gelöscht", p.x.id, p.x.betrag);
        el.classList.toggle("is-active", !!p.x.markiert);
        el.classList.toggle("ist-weg", !!p.x.geloescht);
        el.classList.toggle("is-error", !!p.x.geloescht);
        el.classList.toggle("ist-anker", !!p.x.anker);
        el.classList.toggle("is-pulse", !!p.x.anker);
      }
    });

    /* Beim Offset zeigt auch der Client seine Seitengrenzen - in derselben
       Form wie rechts. Sie stehen fest nach Fach 2 und 4, weil sich die
       Reihenfolge der Abrufe nicht mehr aendert. Genau das ist die Pointe:
       Rechts wandern die Linien, links nicht. */
    var cposten = [];
    s.client.forEach(function (f, i) {
      cposten.push({ art: "eintrag", key: f.fach, f: f, nr: i + 1 });
      if (s.grenzen && (i + 1) % SEITE === 0 && i + 1 < s.client.length) {
        cposten.push({ art: "grenze", key: "cgrenze-" + ((i + 1) / SEITE), nr: (i + 1) / SEITE });
      }
    });

    sim.list(document.getElementById(sz + "-client"), cposten, {
      animated: ctx.animated,
      key: function (p) { return p.key; },
      create: function (p) { return p.art === "grenze" ? grenzzeile() : zelle(); },
      update: function (el, p) {
        if (p.art === "grenze") { beschrifteGrenze(el, p.nr); return; }
        var f = p.f;
        var label = s.grenzen
          ? (f.problem ? "fehlt" : (f.id ? "Pos. " + p.nr : ""))
          : (f.abruf || "");
        fuelle(el, label, f.id || "·····", f.hinweis || f.betrag || "");
        el.classList.toggle("ist-leer", !f.id);
        el.classList.toggle("is-error", !!f.problem);
      }
    });

    document.getElementById(sz + "-clientnotiz").innerHTML = s.clientnotiz || "";

    var frage = document.getElementById(sz + "-frage");
    frage.hidden = !s.frage;
    if (s.frage) frage.querySelector("p").innerHTML = s.frage;

    var lt = document.getElementById(sz + "-leitung");
    lt.classList.toggle("ist-still", !s.leitung);
    lt.querySelector("[data-lt-pfeil]").textContent = s.leitung ? (s.leitung.rueck ? "◀" : "▶") : "";
    lt.querySelector("[data-lt-url]").textContent = s.leitung ? s.leitung.text : "still";
    lt.querySelector("[data-lt-notiz]").innerHTML = s.notiz || "";

    starteBahn(lt.querySelector("[data-lt-bahn]"), ctx.animated && !!s.leitung,
               !!(s.leitung && s.leitung.rueck));

    var nb = document.getElementById(sz + "-nebenbei");
    starteBahn(nb.parentNode.querySelector("[data-nb-bahn]"), ctx.animated && !!s.nebenbei, false);

    sim.list(nb, [{ text: s.nebenbei }], {
      animated: ctx.animated,
      key: function () { return "nb"; },
      create: function () {
        var el = document.createElement("div");
        el.className = "nb__zeile";
        return el;
      },
      update: function (el, x) {
        var neu = x.text || "tut gerade nichts";
        if (el.textContent !== neu && ctx.animated && x.text) sim.pulse(el);
        el.textContent = neu;
        el.classList.toggle("ist-still", !x.text);
        el.classList.toggle("is-error", !!x.text);
      }
    });
  }

  sim.registerScenario({
    id: "offset",
    title: "Blättern mit Offset",
    description: "Drei Seiten à zwei – und dazwischen löscht ein anderer Client den obersten Eintrag.",
    state: function () { var s = blaetternStart(); s.grenzen = true; return s; },
    render: zeichneBlaettern,
    steps: [
      {
        title: "Die Ausgangslage",
        text: "<p>Sechs Bestellungen, <b>neueste zuerst</b>. Ein Programm soll alle abholen – zwei auf einmal. Die gestrichelten Linien rechts zeigen, <b>wo die Seiten enden</b>.</p>" +
              "<p>Dieselben gestrichelten Linien stehen auch links: Das ist die Sicht des Clients darauf, <b>was in welchem Abruf kam</b>. Noch liegen beide Seiten gleich – merk Dir das für später.</p>" +
              "<p><b>Die Sortierung ist die Voraussetzung, nicht die Verzierung:</b> Ohne feste Reihenfolge gibt es keine „Position 3“, auf die sich zwei Anfragen einigen könnten.</p>",
        apply: function () {}
      },
      {
        title: "Die erste Seite",
        text: "<p><code>offset=0&amp;limit=2</code> heißt für den Server: <b>überspringe 0, nimm 2</b>. Der Offset zeigt auf eine <b>Position</b> in der sortierten Liste – nicht auf einen bestimmten Eintrag.</p>",
        apply: function (s) {
          s.leitung = { text: "GET /orders?offset=0&limit=2" };
          s.bestand[0].markiert = true;
          s.bestand[1].markiert = true;
        }
      },
      {
        title: "B-106 und B-105 kommen an",
        text: "<p>Zwei Bestellungen im Client. Er verarbeitet sie – das dauert ein paar Sekunden.</p>",
        apply: function (s) {
          s.leitung = { rueck: true, text: "200 OK · 2 Einträge" };
          s.bestand[0].markiert = s.bestand[1].markiert = false;
          s.client[0] = { fach: "f1", id: "B-106", betrag: "84,50 €" };
          s.client[1] = { fach: "f2", id: "B-105", betrag: "12,00 €" };
        }
      },
      {
        title: "Die zweite Seite",
        text: "<p><code>offset=2&amp;limit=2</code>: <b>überspringe 2, nimm 2</b> – die Positionen 3 und 4. Bis hierhin stimmt alles.</p>",
        apply: function (s) {
          s.leitung = { text: "GET /orders?offset=2&limit=2" };
          s.bestand[2].markiert = true;
          s.bestand[3].markiert = true;
        }
      },
      {
        title: "B-104 und B-103 kommen an",
        text: "<p>Vier von sechs abgeholt. Der Client wird gleich die dritte Seite anfordern.</p>",
        apply: function (s) {
          s.leitung = { rueck: true, text: "200 OK · 2 Einträge" };
          s.bestand[2].markiert = s.bestand[3].markiert = false;
          s.client[2] = { fach: "f3", id: "B-104", betrag: "239,90 €" };
          s.client[3] = { fach: "f4", id: "B-103", betrag: "7,99 €" };
        }
      },
      {
        title: "Ein anderer Client löscht B-106",
        text: "<p>Im Kundendienst storniert jemand die oberste Bestellung – der kleine Kasten in der Mitte. <b>Ein völlig anderer Aufrufer</b>, der von unserem Abholvorgang nichts weiß.</p>" +
              "<p>B-106 bleibt zur Anschauung stehen, ist aber weg: <b>Alles darunter rückt eine Position nach oben, und die Seitengrenzen wandern mit.</b> Was bekommt der Client gleich auf Seite 3?</p>",
        apply: function (s) {
          s.leitung = null;
          s.nebenbei = "DELETE /orders/B-106";
          s.bestand[0].geloescht = true;
          s.notiz = "Position 3 ist jetzt <strong>B-103</strong> statt B-104.";
        }
      },
      {
        title: "Die dritte Seite",
        text: "<p><code>offset=4&amp;limit=2</code>: <b>überspringe 4, nimm 2</b>. Übrig sind nur noch fünf Einträge – also bleibt genau einer.</p>" +
              "<p>Und das ist <b>B-101</b>, nicht B-102. B-102 steht seit dem Löschen auf Position 4, und die hat der Client längst hinter sich.</p>",
        apply: function (s) {
          s.nebenbei = null;
          s.leitung = { text: "GET /orders?offset=4&limit=2" };
          s.bestand[5].markiert = true;
          s.notiz = "Position 5 – mehr gibt es nicht.";
        }
      },
      {
        title: "B-102 hat der Client nie gesehen",
        text: "<p>Fünf Einträge abgeholt, einer fehlt – und <b>nichts an diesem Ablauf sieht nach einem Fehler aus</b>. Jede der drei Anfragen war korrekt gestellt und korrekt beantwortet, jede bekam <code>200 OK</code>.</p>" +
              "<p>Legt stattdessen jemand etwas <b>an</b>, passiert das Gegenteil: Dann rutscht alles nach unten und ein Eintrag kommt <b>zweimal</b>.</p>",
        apply: function (s) {
          s.leitung = { rueck: true, text: "200 OK · 1 Eintrag" };
          s.bestand[5].markiert = false;
          s.client[4] = { fach: "f5", id: "B-101", betrag: "18,20 €" };
          s.notiz = "";
          /* B-102 steht NICHT im Client - es ist nie angekommen. Das leere Fach
             und der Hinweis daneben sind die ehrliche Darstellung. */
          s.clientnotiz = "Das sechste Fach bleibt leer: <strong>B-102 ist nie angekommen</strong> – " +
                          "und der Client weiß nichts davon. Für ihn ist der Bestand vollständig abgeholt.";
        }
      },
      {
        title: "Der Offset zeigt auf eine Position",
        text: "<p><b>Nicht auf einen Eintrag.</b> Links und rechts stehen dieselben drei Seitengrenzen – aber sie liegen nicht mehr zwischen denselben Bestellungen. <b>Rechts sind die Linien gewandert, links nicht</b>, und die Lücke dazwischen ist B-102.</p>" +
              "<p>Für eine Oberfläche mit Seitenzahlen ist das verkraftbar – da sieht ein Mensch hin. Für ein Programm, das einen Bestand <b>vollständig</b> abholen soll, ist es ein stiller Datenverlust.</p>",
        apply: function (s) { s.leitung = null; s.notiz = ""; },
        duration: 6000
      }
    ]
  });

  sim.registerScenario({
    id: "cursor",
    title: "Blättern mit Cursor",
    description: "Derselbe Ablauf, dieselbe Löschung – und am Ende die Frage, was passiert, wenn der Anker selbst verschwindet.",
    state: blaetternStart,
    render: zeichneBlaettern,
    steps: [
      {
        title: "Dieselbe Ausgangslage",
        text: "<p>Derselbe Bestand, dieselbe Aufgabe: alles abholen, zwei auf einmal. Diesmal ohne Seitenposition – <b>und deshalb auch ohne Seitengrenzen</b>.</p>" +
              "<p><b>Die Sortierung bleibt Voraussetzung.</b> Ein Cursor bedeutet „die Stelle in genau dieser Reihenfolge“ – ohne Reihenfolge gibt es kein „danach“.</p>",
        apply: function () {}
      },
      {
        title: "Der erste Abruf",
        text: "<p>Nur <code>limit=2</code>, keine Position. Der Client sagt nicht, <i>wo</i> er anfangen will – er fängt am Anfang an.</p>",
        apply: function (s) {
          s.leitung = { text: "GET /orders?limit=2" };
          s.bestand[0].markiert = s.bestand[1].markiert = true;
        }
      },
      {
        title: "Zwei Bestellungen – und ein Merkzettel",
        text: "<p>Die Antwort enthält zusätzlich einen <b>Cursor</b>: ein undurchsichtiges Merkzeichen auf den <b>letzten gelieferten Eintrag</b>, hier B-105. Der Client muss es nicht verstehen – nur zurückschicken.</p>",
        apply: function (s) {
          s.leitung = { rueck: true, text: "200 OK · nextCursor: eyJpZCI6IkItMTA1In0" };
          s.bestand[0].markiert = s.bestand[1].markiert = false;
          s.bestand[1].anker = true;
          s.client[0] = { fach: "f1", abruf: "1. Abruf", id: "B-106", betrag: "84,50 €" };
          s.client[1] = { fach: "f2", abruf: "1. Abruf", id: "B-105", betrag: "12,00 €" };
          s.notiz = "Der Cursor steht auf <strong>B-105</strong>.";
        }
      },
      {
        title: "Der zweite Abruf",
        text: "<p><code>cursor=…</code> heißt: <b>gib mir, was nach B-105 kommt</b>. Der Server sucht den Anker in der sortierten Liste und liefert die zwei danach.</p>",
        apply: function (s) {
          s.leitung = { text: "GET /orders?limit=2&cursor=eyJpZCI6IkItMTA1In0" };
          s.bestand[2].markiert = s.bestand[3].markiert = true;
          s.notiz = "";
        }
      },
      {
        title: "B-104 und B-103 – Cursor rückt nach",
        text: "<p>Vier von sechs abgeholt, der Cursor steht jetzt auf <b>B-103</b>. Merk Dir diesen Eintrag – auf ihn kommen wir gleich zurück.</p>",
        apply: function (s) {
          s.leitung = { rueck: true, text: "200 OK · nextCursor: eyJpZCI6IkItMTAzIn0" };
          s.bestand[2].markiert = s.bestand[3].markiert = false;
          s.bestand[1].anker = false;
          s.bestand[3].anker = true;
          s.client[2] = { fach: "f3", abruf: "2. Abruf", id: "B-104", betrag: "239,90 €" };
          s.client[3] = { fach: "f4", abruf: "2. Abruf", id: "B-103", betrag: "7,99 €" };
          s.notiz = "Der Cursor steht auf <strong>B-103</strong>.";
        }
      },
      {
        title: "Wieder löscht jemand B-106",
        text: "<p>Dieselbe Störung wie eben, derselbe Kundendienst: <code>DELETE /orders/B-106</code>. Alles rückt eine Position nach oben.</p>" +
              "<p>Nur interessiert das den Cursor nicht. Er zeigt auf <b>B-103</b>, und B-103 ist immer noch B-103 – <b>egal, an welcher Position</b> der Eintrag inzwischen steht.</p>",
        apply: function (s) {
          s.leitung = null;
          s.nebenbei = "DELETE /orders/B-106";
          s.bestand[0].geloescht = true;
          s.notiz = "Der Cursor zeigt auf <strong>einen Eintrag</strong>, nicht auf eine Position.";
        }
      },
      {
        title: "Der dritte Abruf – vollständig",
        text: "<p><b>B-102 und B-101</b>, sauber angeschlossen. Kein Eintrag doppelt, keiner übersprungen.</p>" +
              "<p>Dass B-106 unterwegs verschwunden ist, hat der Client trotzdem nicht mitbekommen – er hatte es ja bereits. <b>Ein Cursor hält die Reihenfolge stabil, nicht den Bestand.</b></p>",
        apply: function (s) {
          s.nebenbei = null;
          s.leitung = { rueck: true, text: "200 OK · nextCursor: null" };
          s.bestand[3].anker = false;
          s.client[4] = { fach: "f5", abruf: "3. Abruf", id: "B-102", betrag: "56,40 €" };
          s.client[5] = { fach: "f6", abruf: "3. Abruf", id: "B-101", betrag: "18,20 €" };
          s.notiz = "Sechs Einträge, jeder <strong>genau einmal</strong>.";
        }
      },
      {
        title: "Eine Frage bleibt offen",
        text: "<p>Gelöscht wurde hier ein Eintrag, den der Client schon hatte. <b>Was aber, wenn es B-103 getroffen hätte</b> – genau den Eintrag, auf dem der Cursor steht?</p>" +
              "<p>Der Client weiß davon nichts und schickt seinen Merkzettel brav zurück. <b>Der Server sucht B-103 und findet es nicht.</b> Und jetzt? Von vorn anfangen, mit einem Fehler antworten, oder raten, wo die Stelle wohl war?</p>",
        apply: function (s) {
          s.leitung = null;
          s.notiz = "";
          s.frage = "Was, wenn genau <b>B-103</b> gelöscht wird –<br>der Eintrag, auf dem der Cursor steht?";
        }
      },
      {
        title: "Zwei Auswege",
        text: "<p><b>Soft Delete.</b> Der Datensatz bleibt stehen und wird nur als gelöscht markiert – genau so, wie B-106 hier rechts durchgestrichen steht. Der Anker bleibt auflösbar, der Eintrag wird beim Ausliefern übersprungen. Preis: Der Bestand wächst ewig, und irgendjemand muss die Leichen später aufräumen.</p>" +
              "<p><b>Oder der Cursor trägt den Sortierwert.</b> Nicht „nach dem Eintrag B-103“, sondern „nach dem Zeitstempel 2026-03-14T09:12Z, ID B-103“. Dann ist der Cursor eine <b>Stelle in der Ordnung</b>, und die gibt es auch dann noch, wenn der Eintrag weg ist.</p>",
        apply: function (s) {
          s.notiz = "";
          s.frage = "";
        }
      },
      {
        title: "Der Preis: kein Sprung auf Seite 7",
        text: "<p><b>Der Cursor zeigt auf einen Eintrag, der Offset auf eine Position.</b> Deshalb ist er stabil – und deshalb kann er nicht springen. „Seite 7“ gibt es nicht, nur „weiter“.</p>" +
              "<p>Blättert ein <b>Mensch</b> durch nummerierte Seiten, nimm den Offset. Holt ein <b>Programm</b> einen Bestand ab oder scrollt eine Oberfläche endlos, nimm den Cursor.</p>" +
              "<p><b>Und wenn selbst das nicht reicht</b> – weil sich wirklich nichts bewegen darf –, macht der Server eine <b>Kopie</b>: <code>POST /orders/exports</code> friert den Stand ein und antwortet mit <code>201</code> und einer eigenen Adresse, in der der Client dann blättert. Bezahlt wird das mit Speicher, einer Verfallsfrist und damit, dass die Daten ab der ersten Seite <b>veraltet</b> sind.</p>",
        apply: function (s) { s.leitung = null; s.notiz = ""; },
        duration: 6000
      }
    ]
  });
})();
