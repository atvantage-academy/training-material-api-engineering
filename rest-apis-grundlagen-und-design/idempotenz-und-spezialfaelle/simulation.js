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
      clientZeilen: [{ id: "c1", label: "Anfrage", name: "noch nichts geschickt", wert: "" }],
      proxyZeilen: [{ id: "p1", label: "1. Versuch", name: "nichts weiterzuleiten", wert: "" }],
      leitung1: null,   // Client ↔ Proxy
      leitung2: null    // Proxy ↔ Server
    };
  }

  function zelle() {
    var el = document.createElement("div");
    el.className = "skr-didaktikon-simulation-cell";
    el.innerHTML = '<span class="skr-didaktikon-simulation-cell__label"></span>' +
                   '<span class="skr-didaktikon-simulation-cell__name"></span>' +
                   '<span class="skr-didaktikon-simulation-cell__value"></span>';
    return el;
  }

  function zeilen(el, liste, ctx) {
    sim.list(el, liste, {
      animated: ctx.animated,
      key: function (x) { return x.id; },
      create: zelle,
      update: function (el, x) {
        el.querySelector(".skr-didaktikon-simulation-cell__label").textContent = x.label || "";
        el.querySelector(".skr-didaktikon-simulation-cell__name").textContent = x.name || "";
        el.querySelector(".skr-didaktikon-simulation-cell__value").textContent = x.wert || "";
        el.classList.toggle("is-error", !!x.fehler);
      }
    });
  }

  /* Die Leitung ist eine Linie, die Nachricht ein Punkt darauf. Der Punkt
     wandert nur, wenn der Schritt vorwärts kommt (ctx.animated) und sich die
     Nachricht geändert hat – sonst steht er gleich am Ziel. */
  function zeichneLeitung(el, l, animiert) {
    if (!el) return;
    if (!el.firstChild) {
      el.innerHTML = '<div class="leitung__text"></div>' +
        '<div class="leitung__draht"><span class="leitung__punkt"></span></div>' +
        '<p class="notiz"></p>';
    }
    var text = el.querySelector(".leitung__text"),
        draht = el.querySelector(".leitung__draht"),
        notiz = el.querySelector(".notiz");
    var sig = l ? (l.rueckweg ? "<" : ">") + (l.weg ? "x" : "") + l.text : "";
    var neu = el.getAttribute("data-sig") !== sig;
    el.setAttribute("data-sig", sig);

    text.innerHTML = l ? l.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/([^ ])\//g, "$1/<wbr>") : "";
    text.classList.toggle("is-weg", !!(l && l.weg));
    notiz.innerHTML = l && l.notiz ? l.notiz : "";

    if (!neu) return;                     // läuft schon oder steht schon am Ziel
    draht.className = "leitung__draht" +
      (l && !l.ruhe ? (l.rueckweg ? " is-rueck" : " is-hin") : "") +
      (l && l.weg ? " is-weg" : "");
    if (l && !l.ruhe && animiert) {
      void draht.offsetWidth;             // Animation neu starten
      draht.classList.add("is-laeuft");
    }
  }

  /* ERST ANKOMMEN, DANN ZEIGEN: Je Schritt wandert eine Nachricht über eine
     Leitung; das Ziel (s.ziel – "proxy", "server" oder "client") ändert sich erst,
     wenn der Punkt dort ist. Ohne Animation (Springen, reduzierte Bewegung) sofort.
     `lauf` verwirft eine verspätete Ankunft, wenn inzwischen weitergeklickt wurde. */
  var ANKUNFT = 1100, lauf = 0;

  function zeichneKunden(el, kunden, ctx) {
    // Gelöschte bleiben stehen – durchgestrichen und ausgegraut.
    sim.list(el, kunden, {
      animated: ctx.animated,
      key: function (x) { return x.id; },
      create: zelle,
      update: function (el, x) {
        el.querySelector(".skr-didaktikon-simulation-cell__label").textContent = "ID " + x.id;
        el.querySelector(".skr-didaktikon-simulation-cell__name").textContent = x.name;
        el.querySelector(".skr-didaktikon-simulation-cell__value").textContent = x.seit;
        el.classList.toggle("is-active", !!x.markiert && !x.weg);
        el.classList.toggle("is-geloescht", !!x.weg);
      }
    });
  }

  sim.setup({
    state: startzustand,

    render: function (s, ctx) {
      var sz = ctx.scenario || "superlativ";
      var teile = {
        client: function () { zeilen(document.getElementById(sz + "-client"), s.clientZeilen, ctx); },
        proxy:  function () { zeilen(document.getElementById(sz + "-proxy"), s.proxyZeilen, ctx); },
        server: function () { zeichneKunden(document.getElementById(sz + "-server"), s.kunden, ctx); }
      };
      var meinLauf = ++lauf;
      Object.keys(teile).forEach(function (k) {
        if (ctx.animated && s.ziel === k) {
          setTimeout(function () { if (meinLauf === lauf) teile[k](); }, ANKUNFT);
        } else {
          teile[k]();
        }
      });

      zeichneLeitung(document.getElementById(sz + "-leitung1"), s.leitung1, ctx.animated);
      zeichneLeitung(document.getElementById(sz + "-leitung2"), s.leitung2, ctx.animated);
    }
  });

  /* Die beiden Szenarien unterscheiden sich nur in der Adresse und darin, was
     beim zweiten Versuch auf dem Server passiert. */
  /* Ein Schritt = ein Transfer über EINE Leitung. Die Szenarien unterscheiden sich
     nur in der Adresse und darin, was beim zweiten Versuch auf dem Server passiert. */
  function szenario(o) {
    var A = "DELETE " + o.adresse, vorab = o.vorab ? [o.vorab] : [];
    function client(wert, fehler) {
      return vorab.concat([{ id: "c1", label: "Anfrage", name: A, wert: wert, fehler: !!fehler }]);
    }
    var p1weg = { id: "p1", label: "1. Versuch", name: A, wert: "Timeout", fehler: true };

    return [
      {
        title: "Die Ausgangslage",
        text: o.start,
        apply: function (s) {
          s.ziel = null;
          if (o.vorab) {
            s.clientZeilen = [o.vorab, { id: "c1", label: "Anfrage", name: "noch nichts geschickt", wert: "" }];
            s.kunden[0].markiert = true;
          }
        }
      },
      {
        title: "Der Client schickt den Auftrag an den Proxy",
        text: o.schicken,
        apply: function (s) {
          s.ziel = "proxy";
          s.clientZeilen = client("wartet …");
          s.proxyZeilen = [{ id: "p1", label: "1. Versuch", name: A, wert: "empfangen" }];
          s.leitung1 = { text: A };
          s.leitung2 = null;
        }
      },
      {
        title: "Der Proxy leitet weiter – der Server führt aus",
        text: o.ausfuehren,
        apply: function (s) {
          s.ziel = "server";
          s.proxyZeilen = [{ id: "p1", label: "1. Versuch", name: A, wert: "weitergeleitet" }];
          s.kunden[0].weg = true;
          s.leitung1 = null;
          s.leitung2 = { text: A, notiz: "Auf dem Server ist die Arbeit <strong>getan</strong>." };
        }
      },
      {
        title: "Die Antwort kommt beim Proxy nie an",
        text: o.verloren,
        apply: function (s) {
          s.ziel = "proxy";
          s.proxyZeilen = [p1weg];
          s.leitung2 = { text: "204 No Content", rueckweg: true, weg: true, notiz: "Der Proxy sieht <strong>nur einen Timeout</strong>." };
        }
      },
      {
        title: o.wiederTitel,
        text: o.wiederText,
        apply: function (s) {
          s.ziel = "server";
          s.proxyZeilen = [p1weg, { id: "p2", label: "2. Versuch", name: A, wert: "weitergeleitet" }];
          s.clientZeilen = client("wartet noch …");
          if (o.zweitLoescht) s.kunden[1].weg = true;
          s.leitung2 = { text: A, notiz: o.wiederNotiz };
        }
      },
      {
        title: "Diesmal kommt die Antwort beim Proxy an",
        text: o.zurueckText,
        apply: function (s) {
          s.ziel = "proxy";
          s.proxyZeilen = [p1weg, { id: "p2", label: "2. Versuch", name: A, wert: o.zweitStatus }];
          s.leitung2 = { text: o.zweitStatus, rueckweg: true };
        }
      },
      {
        title: "Der Proxy gibt die Antwort an den Client",
        text: o.clientText,
        apply: function (s) {
          s.ziel = "client";
          s.clientZeilen = client(o.clientWert, o.clientFehler);
          s.leitung2 = null;
          s.leitung1 = { text: o.zweitStatus, rueckweg: true, notiz: o.clientNotiz };
        }
      },
      {
        title: o.schlussTitel,
        text: o.schlussText,
        apply: function (s) { s.ziel = null; s.leitung1 = null; s.leitung2 = null; },
        duration: 5000
      }
    ];
  }

  sim.registerScenario({
    id: "superlativ",
    title: "Der Superlativ in der Adresse",
    description: "DELETE /customers/oldest – die Adresse bezeichnet bei jedem Aufruf jemand anderen.",
    steps: szenario({
      adresse: "/customers/oldest",
      start: "<p>Drei Kunden im Bestand. Der Fachbereich möchte, dass der <b>älteste</b> gelöscht wird – Anna Berger, seit 2019 dabei.</p><p>Zwischen Client und Server steht ein <b>Proxy</b> – ein Gateway, ein Load Balancer, ein Sidecar. Er ist so eingestellt, dass er bei einem Timeout <b>selbst</b> noch einmal versucht.</p>",
      schicken: "<p>Ein einziger Aufruf, bequem und lesbar. Er geht zuerst an den <b>Proxy</b> – der Client sieht den Server nie direkt.</p>",
      ausfuehren: "<p>Der Proxy reicht die Anfrage unverändert durch. Der Server sortiert, findet Anna Berger – und löscht sie. Fachlich genau richtig.</p>",
      verloren: "<p>Ein Verbindungsabbruch, ein überlasteter Knoten – die Antwort geht <b>zwischen Server und Proxy</b> verloren.</p><p><b>Der Proxy weiß jetzt nichts.</b> Er kann nicht unterscheiden, ob der Server gar nichts getan hat oder ob nur die Bestätigung fehlt.</p>",
      wiederTitel: "Der Proxy wiederholt – und jetzt ist Bruno der älteste",
      wiederText: "<p>Der Proxy tut, wofür er eingestellt ist: Er schickt <b>dieselbe Anfrage</b> noch einmal, Zeichen für Zeichen. Der Client merkt davon nichts.</p><p>Der Server sortiert erneut. Anna ist weg – also ist <b>Bruno Cimen</b> der älteste Kunde. Und wird gelöscht.</p>",
      wiederNotiz: "Zwei Kunden verloren, obwohl nur einer gemeint war.",
      zurueckText: "<p><code>204 No Content</code> erreicht den Proxy. Für ihn ist die Sache erledigt – der zweite Versuch hat geklappt.</p>",
      clientText: "<p>Der Client hat <b>eine</b> Anfrage geschickt und bekommt <b>eine</b> Antwort. Dass zwei Kunden fehlen, sieht er nicht.</p>",
      zweitLoescht: true,
      zweitStatus: "204 No Content",
      clientWert: "204 – alles gut?",
      clientFehler: true,
      clientNotiz: "Der Client hält das für <strong>einen</strong> erfolgreichen Löschvorgang.",
      schlussTitel: "Es lag nicht an der Methode – und nicht am Proxy",
      schlussText: "<p><b>DELETE ist idempotent – diese Adresse ist es nicht.</b> <code>/customers/oldest</code> hat beim zweiten Aufruf jemand anderen bezeichnet als beim ersten.</p><p>Der Proxy hat nichts falsch gemacht: Eine idempotente Anfrage darf er wiederholen, ohne zu fragen – genau darauf verlässt er sich. Eine Adresse muss deshalb bei jedem Aufruf dieselbe Sache meinen.</p>"
    })
  });

  sim.registerScenario({
    id: "feste-id",
    title: "Dieselbe Adresse, dieselbe Sache",
    description: "Erst nachsehen, dann gezielt löschen – ein Aufruf mehr, dafür beliebig wiederholbar.",
    state: startzustand,
    steps: szenario({
      adresse: "/customers/1",
      vorab: { id: "c0", label: "Vorab", name: "GET …?sort=createdAt&limit=1", wert: "→ ID 1" },
      start: "<p>Derselbe Bestand, derselbe Proxy, dieselbe Anforderung. Diesmal fragt der Client aber <b>zuerst</b>, wer der älteste ist: <code>GET /customers?sort=createdAt&amp;limit=1</code>.</p><p>Die Antwort: Anna Berger, ID 1.</p>",
      schicken: "<p>Jetzt trägt die Adresse eine <b>feste ID</b>. Der Client weiß, wen er löscht – und könnte es vorher jemandem zeigen.</p>",
      ausfuehren: "<p>Der Proxy leitet weiter, Anna Berger wird gelöscht. Genau wie im ersten Szenario.</p>",
      verloren: "<p>Dieselbe Störung wie vorhin: Die Antwort geht zwischen Server und Proxy verloren, der Proxy sieht nur einen Timeout.</p>",
      wiederTitel: "Der Proxy wiederholt – diesmal passiert nichts",
      wiederText: "<p>Derselbe Proxy, dieselbe Einstellung – er wiederholt. Nur heißt die Adresse jetzt <code>/customers/1</code>.</p><p>Kunde 1 ist schon weg. Der Server hat nichts zu tun und antwortet <code>404</code> – oder wieder <code>204</code>, das ist eine Entwurfsentscheidung.</p>",
      wiederNotiz: "Der Bestand bleibt, wie er ist.",
      zurueckText: "<p><code>404 Not Found</code> erreicht den Proxy. <b>Der Bestand ist unverändert</b> – Bruno und Cem sind noch da.</p>",
      clientText: "<p>Der Client bekommt <code>404</code>: Kunde 1 war schon weg. Genau das wollte er erreichen.</p>",
      zweitLoescht: false,
      zweitStatus: "404 Not Found",
      clientWert: "404 – war schon weg",
      clientFehler: false,
      clientNotiz: "Andere <strong>Antwort</strong>, gleicher <strong>Zustand</strong>.",
      schlussTitel: "Idempotenz ist entwerfbar",
      schlussText: "<p><b>Idempotent heißt: derselbe Zustand, nicht dieselbe Antwort.</b> Die <code>404</code> beim zweiten Mal ist kein Widerspruch – der Bestand ist gleich geblieben.</p><p>Der Preis: ein Aufruf mehr, und zwischen Lesen und Löschen kann sich die Liste ändern. Dafür darf der Proxy wiederholen, so oft er will – und der Client entscheidet, wen er löscht.</p>"
    })
  });
})();
