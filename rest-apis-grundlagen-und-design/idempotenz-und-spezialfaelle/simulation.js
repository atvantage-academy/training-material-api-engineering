/* Skript der Seite 04-idempotenz-und-spezialfaelle/simulation.md – über `scripts:` im Front Matter geladen. */
(function () {
  "use strict";
  var sim = window.skr.ext.didaktikon.simulation;

  function ausgangsbestand() {
    return [
      { id: "1", name: "Anna Berger",  seit: "Kunde seit 2019", weg: false },
      { id: "5", name: "Bruno Cimen",  seit: "Kunde seit 2021", weg: false },
      { id: "9", name: "Cem Dogan",    seit: "Kunde seit 2023", weg: false }
    ];
  }

  function startzustand() {
    return {
      kunden: ausgangsbestand(),
      clientZeilen: [{ id: "c0", label: "Stand", name: "noch nichts geschickt", wert: "" }],
      leitung: null,
      notiz: ""
    };
  }

  sim.setup({
    state: startzustand,

    render: function (s, ctx) {
      var szenario = ctx.scenario || "superlativ";

      sim.list(document.getElementById(szenario + "-client"), s.clientZeilen, {
        animated: ctx.animated,
        key: function (x) { return x.id; },
        create: function () {
          var el = document.createElement("div");
          el.className = "skr-didaktikon-simulation-cell";
          el.innerHTML = '<span class="skr-didaktikon-simulation-cell__label"></span>' +
                         '<span class="skr-didaktikon-simulation-cell__name"></span>' +
                         '<span class="skr-didaktikon-simulation-cell__value"></span>';
          return el;
        },
        update: function (el, x) {
          el.querySelector(".skr-didaktikon-simulation-cell__label").textContent = x.label || "";
          el.querySelector(".skr-didaktikon-simulation-cell__name").textContent = x.name || "";
          el.querySelector(".skr-didaktikon-simulation-cell__value").textContent = x.wert || "";
          el.classList.toggle("is-error", !!x.fehler);
        }
      });

      sim.list(document.getElementById(szenario + "-server"), s.kunden.filter(function (k) { return !k.weg; }), {
        animated: ctx.animated,
        key: function (x) { return x.id; },
        create: function () {
          var el = document.createElement("div");
          el.className = "skr-didaktikon-simulation-cell";
          el.innerHTML = '<span class="skr-didaktikon-simulation-cell__label"></span>' +
                         '<span class="skr-didaktikon-simulation-cell__name"></span>' +
                         '<span class="skr-didaktikon-simulation-cell__value"></span>';
          return el;
        },
        update: function (el, x) {
          el.querySelector(".skr-didaktikon-simulation-cell__label").textContent = "ID " + x.id;
          el.querySelector(".skr-didaktikon-simulation-cell__name").textContent = x.name;
          el.querySelector(".skr-didaktikon-simulation-cell__value").textContent = x.seit;
          el.classList.toggle("is-active", !!x.markiert);
        }
      });

      var leitung = document.getElementById(szenario + "-leitung");
      if (!leitung) return;
      if (!s.leitung) {
        leitung.innerHTML = '<p class="leitung__still">still</p>';
      } else {
        leitung.innerHTML =
          '<div class="leitung__pfeil">' + (s.leitung.rueckweg ? "◀" : "▶") + "</div>" +
          '<div class="leitung__paket' + (s.leitung.weg ? " is-weg" : "") + '">' +
          s.leitung.text.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</div>" +
          (s.notiz ? '<p class="notiz">' + s.notiz + "</p>" : "");
      }
    }
  });

  sim.registerScenario({
    id: "superlativ",
    title: "Der Superlativ in der Adresse",
    description: "DELETE /customers/oldest – die Adresse bezeichnet bei jedem Aufruf jemand anderen.",
    steps: [
      {
        title: "Die Ausgangslage",
        text: "<p>Drei Kunden im Bestand. Der Fachbereich möchte, dass der <b>älteste</b> gelöscht wird – Anna Berger, seit 2019 dabei.</p><p>Der Client hat noch nichts geschickt.</p>",
        apply: function () { /* Ausgangslage */ }
      },
      {
        title: "Der Client schickt den Auftrag",
        text: "<p>Ein einziger Aufruf, bequem und lesbar. Der Server soll selbst herausfinden, wer der älteste ist.</p>",
        apply: function (s) {
          s.leitung = { text: "DELETE /customers/oldest", rueckweg: false, weg: false };
          s.clientZeilen = [{ id: "c1", label: "1. Versuch", name: "DELETE /customers/oldest", wert: "wartet …" }];
        }
      },
      {
        title: "Der Server führt aus",
        text: "<p>Der Server sortiert, findet Anna Berger – und löscht sie. Fachlich genau richtig.</p>",
        apply: function (s) {
          s.kunden[0].weg = true;
          s.leitung = { text: "204 No Content", rueckweg: true, weg: false };
          s.notiz = "Auf dem Server ist die Arbeit <strong>getan</strong>.";
        }
      },
      {
        title: "Die Antwort kommt nie an",
        text: "<p>Ein Timeout, ein Verbindungsabbruch, ein überlastetes Gateway – die Antwort geht auf dem Rückweg verloren.</p><p><b>Der Client weiß jetzt nichts.</b> Er kann nicht unterscheiden, ob der Server gar nichts getan hat oder ob nur die Bestätigung fehlt.</p>",
        apply: function (s) {
          s.leitung = { text: "204 No Content", rueckweg: true, weg: true };
          s.clientZeilen = [{ id: "c1", label: "1. Versuch", name: "DELETE /customers/oldest", wert: "Timeout", fehler: true }];
          s.notiz = "Der Client sieht <strong>nur einen Timeout</strong>.";
        }
      },
      {
        title: "Also noch einmal",
        text: "<p>Genau das tut jede Retry-Logik – in der Client-Bibliothek, im Gateway, oder weil jemand den Knopf noch einmal drückt.</p><p>Es ist <b>dieselbe Anfrage</b>, Zeichen für Zeichen.</p>",
        apply: function (s) {
          s.leitung = { text: "DELETE /customers/oldest", rueckweg: false, weg: false };
          s.clientZeilen = [
            { id: "c1", label: "1. Versuch", name: "DELETE /customers/oldest", wert: "Timeout", fehler: true },
            { id: "c2", label: "2. Versuch", name: "DELETE /customers/oldest", wert: "wartet …" }
          ];
          s.notiz = "";
        }
      },
      {
        title: "Und jetzt ist Bruno der älteste",
        text: "<p>Der Server sortiert erneut. Anna ist weg – also ist <b>Bruno Cimen</b> der älteste Kunde. Und wird gelöscht.</p><p>Zwei Kunden verloren, obwohl nur einer gemeint war. Beide Aufrufe waren korrekt.</p>",
        apply: function (s) {
          s.kunden[1].weg = true;
          s.leitung = { text: "204 No Content", rueckweg: true, weg: false };
          s.clientZeilen = [
            { id: "c1", label: "1. Versuch", name: "DELETE /customers/oldest", wert: "Timeout", fehler: true },
            { id: "c2", label: "2. Versuch", name: "DELETE /customers/oldest", wert: "204 – alles gut?", fehler: true }
          ];
          s.notiz = "Der Client hält das für <strong>einen</strong> erfolgreichen Löschvorgang.";
        }
      },
      {
        title: "Es lag nicht an der Methode",
        text: "<p><b>DELETE ist idempotent – diese Adresse ist es nicht.</b> <code>/customers/oldest</code> hat beim zweiten Aufruf jemand anderen bezeichnet als beim ersten.</p><p>Eine Adresse muss bei jedem Aufruf dieselbe Sache meinen. Sonst ist keine Wiederholung mehr sicher.</p>",
        apply: function (s) {
          s.leitung = null;
          s.notiz = "";
        },
        duration: 5000
      }
    ]
  });

  sim.registerScenario({
    id: "feste-id",
    title: "Dieselbe Adresse, dieselbe Sache",
    description: "Erst nachsehen, dann gezielt löschen – ein Aufruf mehr, dafür beliebig wiederholbar.",
    state: startzustand,
    steps: [
      {
        title: "Die Ausgangslage",
        text: "<p>Derselbe Bestand, dieselbe Anforderung. Diesmal fragt der Client aber <b>zuerst</b>, wer der älteste ist: <code>GET /customers?sort=createdAt&amp;limit=1</code>.</p><p>Die Antwort: Anna Berger, ID 1.</p>",
        apply: function (s) {
          s.clientZeilen = [{ id: "c0", label: "Vorab", name: "GET …?sort=createdAt&limit=1", wert: "→ ID 1" }];
          s.kunden[0].markiert = true;
        }
      },
      {
        title: "Der Client löscht gezielt",
        text: "<p>Jetzt trägt die Adresse eine <b>feste ID</b>. Der Client weiß, wen er löscht – und könnte es vorher jemandem zeigen.</p>",
        apply: function (s) {
          s.leitung = { text: "DELETE /customers/1", rueckweg: false, weg: false };
          s.clientZeilen = [
            { id: "c0", label: "Vorab", name: "GET …?sort=createdAt&limit=1", wert: "→ ID 1" },
            { id: "c1", label: "1. Versuch", name: "DELETE /customers/1", wert: "wartet …" }
          ];
        }
      },
      {
        title: "Der Server führt aus",
        text: "<p>Anna Berger wird gelöscht. Genau wie im ersten Szenario.</p>",
        apply: function (s) {
          s.kunden[0].weg = true;
          s.leitung = { text: "204 No Content", rueckweg: true, weg: false };
        }
      },
      {
        title: "Und wieder geht die Antwort verloren",
        text: "<p>Dieselbe Störung wie vorhin. Der Client sieht wieder nur einen Timeout und weiß nicht, was passiert ist.</p>",
        apply: function (s) {
          s.leitung = { text: "204 No Content", rueckweg: true, weg: true };
          s.clientZeilen = [
            { id: "c0", label: "Vorab", name: "GET …?sort=createdAt&limit=1", wert: "→ ID 1" },
            { id: "c1", label: "1. Versuch", name: "DELETE /customers/1", wert: "Timeout", fehler: true }
          ];
          s.notiz = "Der Client sieht <strong>nur einen Timeout</strong>.";
        }
      },
      {
        title: "Also noch einmal – dieselbe Anfrage",
        text: "<p>Dieselbe Retry-Logik, derselbe Reflex. Nur heißt die Adresse jetzt <code>/customers/1</code>.</p>",
        apply: function (s) {
          s.leitung = { text: "DELETE /customers/1", rueckweg: false, weg: false };
          s.clientZeilen = [
            { id: "c0", label: "Vorab", name: "GET …?sort=createdAt&limit=1", wert: "→ ID 1" },
            { id: "c1", label: "1. Versuch", name: "DELETE /customers/1", wert: "Timeout", fehler: true },
            { id: "c2", label: "2. Versuch", name: "DELETE /customers/1", wert: "wartet …" }
          ];
          s.notiz = "";
        }
      },
      {
        title: "Diesmal passiert nichts mehr",
        text: "<p>Kunde 1 ist schon weg. Der Server hat nichts zu tun und antwortet <code>404</code> – oder wieder <code>204</code>, das ist eine Entwurfsentscheidung.</p><p><b>Der Bestand ist unverändert.</b> Bruno und Cem sind noch da.</p>",
        apply: function (s) {
          s.leitung = { text: "404 Not Found", rueckweg: true, weg: false };
          s.clientZeilen = [
            { id: "c0", label: "Vorab", name: "GET …?sort=createdAt&limit=1", wert: "→ ID 1" },
            { id: "c1", label: "1. Versuch", name: "DELETE /customers/1", wert: "Timeout", fehler: true },
            { id: "c2", label: "2. Versuch", name: "DELETE /customers/1", wert: "404 – war schon weg" }
          ];
          s.notiz = "Andere <strong>Antwort</strong>, gleicher <strong>Zustand</strong>.";
        }
      },
      {
        title: "Idempotenz ist entwerfbar",
        text: "<p><b>Idempotent heißt: derselbe Zustand, nicht dieselbe Antwort.</b> Die <code>404</code> beim zweiten Mal ist kein Widerspruch – der Bestand ist gleich geblieben.</p><p>Der Preis: ein Aufruf mehr, und zwischen Lesen und Löschen kann sich die Liste ändern. Dafür entscheidet der Client, wen er löscht – und kann es vorher sehen.</p>",
        apply: function (s) {
          s.leitung = null;
          s.notiz = "";
        },
        duration: 5000
      }
    ]
  });
})();
