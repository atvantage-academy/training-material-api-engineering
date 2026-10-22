/* Skript der Seite 02-http-grundlagen/simulation.md – über `scripts:` im Front Matter geladen. */
(function () {
  "use strict";
  var sim = window.skr.ext.didaktikon.simulation;

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* `t` ist der Taktzaehler: Jedes `apply` zaehlt ihn hoch, und jeder Eintrag
     merkt sich den Takt seiner Entstehung. Was im AKTUELLEN Takt entstand, steht
     in Farbe – alles Aeltere wird blass. Damit braucht kein Schritt die
     Eintraege der vorherigen anzufassen. */
  function start() {
    return { t: 0, adresse: "", adresseNeu: false, seite: [], taste: null,
             leitung: [], slog: [], bestand: [], hinweis: null, marke: null };
  }
  function takt(s) { s.t += 1; }
  function sende(s, n) {
    n.t = s.t; n.id = "l" + s.leitung.length; s.leitung.push(n);
  }
  function tut(s, art, text, fehler) {
    s.slog.push({ id: "s" + s.slog.length, t: s.t, art: art, text: text, fehler: !!fehler });
  }

  /* Eine Seitenzeile zu HTML. `formular` traegt den Quelltext GRAU AM RAHMEN –
     er ist das, was dahintersteht, und darf nicht wie ein ausfuellbares Feld
     aussehen. Die Bedienelemente darin sehen dagegen aus wie Bedienelemente. */
  function zeile(z, bewegt) {
    if (z.art === "formular") {
      var innen = (z.inhalt || []).map(function (i) {
        if (i.art === "eingabe") {
          return '<label class="eingabe">' +
                 '<span class="eingabe__code">' + esc(i.code) + "</span>" +
                 '<span class="eingabe__feld' + (i.aktiv ? " is-aktiv" : "") + (i.tippt && bewegt ? " is-tippt" : "") + '">' +
                 '<span class="eingabe__wert">' + esc(i.wert || "") + "</span>" +
                 (i.aktiv ? '<span class="karet">&nbsp;</span>' : "") + "</span></label>";
        }
        if (i.art === "knopf") {
          return '<div><span class="knopf' + (i.gedrueckt && bewegt ? " is-gedrueckt" : "") + '">' + esc(i.text) + "</span></div>";
        }
        return '<div class="seite__zeile">' + esc(i.text) + "</div>";
      }).join("");
      return '<div class="formular"><span class="formular__code">' + esc(z.code) + "</span>" + innen + "</div>";
    }
    return '<div class="seite__zeile seite__zeile--' + (z.art || "text") +
           (z.geklickt ? " is-geklickt" : "") + '">' + esc(z.text) + "</div>";
  }

  /* Die vollstaendige Nachricht: Am LEEREN String trennen: davor steht, was auf
     dem Umschlag steht, danach der Zettel darin. Genau diese Trennung macht die
     Leerzeile. */
  function volleNachricht(n) {
    var z = n.zeilen, i = z.indexOf("");
    var umschlag = (i < 0 ? z : z.slice(0, i)).join("\n");
    var zettel = i < 0 ? "" : z.slice(i + 1).join("\n");
    var leer = /^\(/.test(zettel.trim());
    return '<div class="prot__voll">' +
           '<div class="prot__umschlag">' + esc(umschlag) + "</div>" +
           (zettel ? '<div class="prot__zettel' + (leer ? " prot__zettel--leer" : "") + '">' + esc(zettel) + "</div>" : "") +
           '<p class="prot__legende">auf dem Umschlag · im Umschlag</p>' +
           "</div>";
  }

  sim.setup({
    state: start,

    render: function (s, ctx) {
      var sz = ctx.scenario || "link";
      var bewegt = !!ctx.animated;

      var adr = document.getElementById(sz + "-adresse");
      if (adr) {
        adr.classList.toggle("is-neu", !!s.adresseNeu);
        adr.innerHTML = '<span class="adresszeile__schloss" aria-hidden="true">🔒</span><span>' + esc(s.adresse) + "</span>";
      }

      var seite = document.getElementById(sz + "-seite");
      if (seite) {
        seite.innerHTML =
          (s.taste
            ? '<p class="taste' + (bewegt && s.taste.t === s.t ? " is-gedrueckt" : "") + '">' +
              '<span class="taste__kappe">' + esc(s.taste.text) + "</span>" +
              "<span>" + esc(s.taste.was) + "</span></p>"
            : "") +
          s.seite.map(function (z) { return zeile(z, bewegt); }).join("") +
          (s.hinweis ? '<p class="hinweis' + (s.hinweis.art ? " hinweis--" + s.hinweis.art : "") + '">' + s.hinweis.text + "</p>" : "") +
          (s.marke ? '<div><span class="marke">' + s.marke + "</span></div>" : "");
      }

      /* Leitung: Protokoll statt Momentaufnahme. */
      var still = document.getElementById(sz + "-still");
      if (still) still.style.display = s.leitung.length ? "none" : "";
      var liste = document.getElementById(sz + "-msg");
      sim.list(liste, s.leitung, {
        animated: ctx.animated,
        key: function (x) { return x.id; },
        create: function () {
          var el = document.createElement("div");
          el.className = "prot__e";
          el.innerHTML = '<span class="prot__pfeil"></span><span class="prot__inhalt"></span>';
          return el;
        },
        update: function (el, n) {
          var aktiv = n.t === s.t;
          el.className = "prot__e" + (n.rueck ? " prot__e--zurueck" : " prot__e--hin") +
                         (aktiv ? "" : " prot__e--alt") + (n.warn ? " prot__e--warn" : "") +
                         (el.classList.contains("is-new") ? " is-new" : "");
          el.querySelector(".prot__pfeil").textContent = n.rueck ? "◀" : "▶";
          el.querySelector(".prot__inhalt").innerHTML = aktiv
            ? volleNachricht(n)
            : '<span class="prot__kurz">' + esc(n.zeilen[0]) + "</span>";
        }
      });
      if (liste) liste.scrollTop = liste.scrollHeight;

      /* Server: schreibt mit, was er tut. */
      var sstill = document.getElementById(sz + "-slogstill");
      if (sstill) sstill.style.display = s.slog.length ? "none" : "";
      var log = document.getElementById(sz + "-log");
      sim.list(log, s.slog, {
        animated: ctx.animated,
        key: function (x) { return x.id; },
        create: function () {
          var el = document.createElement("div");
          el.className = "slog__e";
          el.innerHTML = '<span class="slog__punkt"></span><span class="slog__art"></span><span class="slog__text"></span>';
          return el;
        },
        update: function (el, x) {
          var aktiv = x.t === s.t;
          el.className = "slog__e" + (aktiv ? " slog__e--aktiv" : " slog__e--alt") +
                         (x.fehler ? " slog__e--fehler" : "") +
                         (el.classList.contains("is-new") ? " is-new" : "");
          el.querySelector(".slog__art").textContent = x.art;
          el.querySelector(".slog__text").textContent = x.text;
        }
      });
      if (log) log.scrollTop = log.scrollHeight;

      var btitel = document.getElementById(sz + "-bestandtitel");
      if (btitel) btitel.style.display = s.bestand.length ? "" : "none";
      sim.list(document.getElementById(sz + "-bestand"), s.bestand, {
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
    }
  });

  /* ================================================ 1 · Link anklicken (GET) */
  var GET_PRODUKT = ["GET /produkte/kaffeemuehle HTTP/1.1", "Host: shop.example.com", "", "(kein Body)"];
  var ANTWORT_SEITE = ["HTTP/1.1 200 OK", "Content-Type: text/html; charset=utf-8", "Content-Length: 1526", "", "<!DOCTYPE html> … "];

  sim.registerScenario({
    id: "link",
    title: "Ein Link wird geklickt",
    description: "Der einfachste Fall: GET holt eine Seite. Die Adresse trägt alles.",
    state: function () {
      var s = start();
      s.adresse = "https://shop.example.com/produkte";
      s.seite = [
        { art: "titel", text: "Unsere Produkte" },
        { art: "link",  text: "Kaffeemühle" },
        { art: "link",  text: "Milchaufschäumer" }
      ];
      return s;
    },
    steps: [
      { title: "Die Ausgangslage",
        text: "<p>Der Browser zeigt eine Seite. In der Adresszeile steht, woher sie kam.</p><p>Leitung und Serverprotokoll sind leer – <b>der Server spricht nie von sich aus</b>.</p>",
        apply: function (s) { takt(s); } },
      { title: "Jemand klickt den Link",
        text: "<p>Mehr passiert hier nicht: Der Browser liest die Adresse aus dem Link und baut daraus eine Anfrage.</p>",
        apply: function (s) { takt(s); s.seite[1].geklickt = true; } },
      { title: "Die Anfrage geht raus",
        text: "<p>Startzeile, Header, Leerzeile – und kein Body. <code>GET</code> <b>holt</b> etwas, es gibt nichts zu übergeben.</p><p>Die Nachricht steht jetzt im Protokoll der Leitung und bleibt dort stehen.</p>",
        apply: function (s) { takt(s); sende(s, { zeilen: GET_PRODUKT }); } },
      { title: "Der Server empfängt sie und arbeitet",
        text: "<p>Jetzt ist der Server an der Reihe: Er liest die Startzeile, sucht die Produktdaten und baut die Seite.</p><p>Auf der Leitung ist es währenddessen still – die Anfrage ist blass geworden, sie ist Vergangenheit.</p>",
        apply: function (s) {
          takt(s);
          tut(s, "empfangen", "GET /produkte/kaffeemuehle");
          tut(s, "verarbeitet", "Produktdaten gelesen, Seite gebaut");
        } },
      { title: "Der Server antwortet",
        text: "<p><code>200 OK</code> – hat geklappt. <code>Content-Type</code> sagt dem Browser, <b>was</b> im Body liegt.</p><p>Die Antwort geht in die Gegenrichtung über dieselbe Leitung.</p>",
        apply: function (s) {
          takt(s);
          tut(s, "gesendet", "200 OK · text/html");
          sende(s, { rueck: true, zeilen: ANTWORT_SEITE });
        } },
      { title: "Der Browser zeigt die Seite",
        text: "<p>Und die <b>Adresszeile ändert sich mit</b>. Die Adresse beschreibt, was man gerade sieht.</p>",
        apply: function (s) {
          takt(s);
          s.adresse = "https://shop.example.com/produkte/kaffeemuehle";
          s.adresseNeu = true;
          s.seite = [
            { art: "titel", text: "Kaffeemühle" },
            { art: "text",  text: "Kegelmahlwerk, 15 Stufen" },
            { art: "text",  text: "84,50 €" }
          ];
        } },
      { title: "F5 – dieselbe Anfrage noch einmal",
        text: "<p>Der Browser schickt die Anfrage erneut, der Server arbeitet erneut.</p><p><b>Lies das Protokoll von oben nach unten</b>: Es wiederholt sich Zeile für Zeile.</p>",
        apply: function (s) {
          takt(s);
          s.adresseNeu = false;
          s.taste = { text: "F5", was: "neu laden", t: s.t };
          sende(s, { zeilen: GET_PRODUKT });
          tut(s, "empfangen", "GET /produkte/kaffeemuehle");
          tut(s, "verarbeitet", "Produktdaten gelesen, Seite gebaut");
        } },
      { title: "Und dieselbe Antwort",
        text: "<p>Gleiche Nachricht, gleiche Seite. Niemand musste vorher fragen, ob das in Ordnung ist.</p>",
        apply: function (s) {
          takt(s);
          tut(s, "gesendet", "200 OK · text/html");
          sende(s, { rueck: true, zeilen: ANTWORT_SEITE });
        } },
      { title: "GET holt – und verändert nichts",
        text: "<p><b>Die Adresse trägt alles.</b> Deshalb kannst Du sie verschicken, als Lesezeichen speichern und beliebig oft aufrufen.</p>",
        apply: function (s) { takt(s); s.taste = null; s.marke = "teilbar · Lesezeichen · beliebig wiederholbar"; },
        duration: 5000 }
    ]
  });

  /* ============================================= 2 · Suchformular (GET+Query) */
  function suchseite(wert, aktiv, tippt, gedrueckt) {
    return [
      { art: "titel", text: "Suche" },
      { art: "formular", code: '<form method="get" action="/suche">', inhalt: [
        { art: "eingabe", code: '<input name="q">', wert: wert, aktiv: aktiv, tippt: tippt },
        { art: "knopf", text: "Suchen", gedrueckt: gedrueckt }
      ] }
    ];
  }

  sim.registerScenario({
    id: "suche",
    title: "Ein Suchformular",
    description: "Auch ein Formular kann GET sein – dann landet die Eingabe in der Adresse.",
    state: function () {
      var s = start();
      s.adresse = "https://shop.example.com/";
      s.seite = suchseite("", false, false, false);
      return s;
    },
    steps: [
      { title: "Ein Formular mit method=\"get\"",
        text: "<p>Grau am Rahmen steht der Quelltext dahinter, innen die Bedienelemente.</p><p>Ein Suchformular <b>holt</b> nur etwas – deshalb <code>method=\"get\"</code>.</p>",
        apply: function (s) { takt(s); } },
      { title: "Jemand tippt einen Suchbegriff",
        text: "<p>Die Eingabe steht im Feld <code>q</code> – noch ist nichts verschickt, die Leitung bleibt leer.</p>",
        apply: function (s) { takt(s); s.seite = suchseite("kaffee", true, true, false); } },
      { title: "Absenden",
        text: "<p>Klick auf „Suchen“. Jetzt baut der Browser die Anfrage.</p>",
        apply: function (s) { takt(s); s.seite = suchseite("kaffee", false, false, true); } },
      { title: "Der Browser hängt die Eingabe an die Adresse",
        text: "<p>Das ist der entscheidende Schritt: Aus dem Feld <code>q</code> wird <code>?q=kaffee</code> <b>in der Adresse</b>. Es gibt keinen Body.</p><p>Bei mehreren Feldern werden sie mit <code>&amp;</code> verkettet.</p>",
        apply: function (s) {
          takt(s);
          s.seite = suchseite("kaffee", false, false, false);
          sende(s, { zeilen: ["GET /suche?q=kaffee HTTP/1.1", "Host: shop.example.com", "", "(kein Body)"] });
        } },
      { title: "Der Server empfängt sie und sucht",
        text: "<p>Er liest den Wert aus der Adresse und durchsucht seinen Bestand. <b>Nichts wird dabei verändert</b> – Suchen ist Lesen.</p>",
        apply: function (s) {
          takt(s);
          tut(s, "empfangen", "GET /suche?q=kaffee");
          tut(s, "verarbeitet", "Bestand durchsucht · 3 Treffer");
        } },
      { title: "Der Server antwortet",
        text: "<p><code>200</code> und eine HTML-Seite – diesmal die Trefferliste.</p>",
        apply: function (s) {
          takt(s);
          tut(s, "gesendet", "200 OK · Trefferliste");
          sende(s, { rueck: true, zeilen: ["HTTP/1.1 200 OK", "Content-Type: text/html; charset=utf-8", "", "<!DOCTYPE html> … 3 Treffer …"] });
        } },
      { title: "Die Suche steht in der Adresszeile",
        text: "<p>Deshalb kann man sie <b>verschicken</b>, als <b>Lesezeichen</b> speichern und mit <kbd>F5</kbd> neu laden.</p>",
        apply: function (s) {
          takt(s);
          s.adresse = "https://shop.example.com/suche?q=kaffee";
          s.adresseNeu = true;
          s.seite = [
            { art: "titel", text: "3 Treffer für „kaffee“" },
            { art: "link",  text: "Kaffeemühle" },
            { art: "link",  text: "Kaffeebohnen, 1 kg" },
            { art: "link",  text: "Kaffeefilter" }
          ];
        } },
      { title: "Was in die Adresse gehört – und was nicht",
        text: "<p>Ein Suchbegriff darf dort stehen. <b>Ein Passwort nicht.</b> Die Adresse landet im Verlauf, in Lesezeichen und in den Protokollen jedes Servers auf dem Weg.</p><p>Das ist einer der Gründe, warum es <code>POST</code> gibt.</p>",
        apply: function (s) {
          takt(s);
          s.adresseNeu = false;
          s.hinweis = { text: "<b>Nie in die Adresse:</b> Passwörter, Kartennummern, Gesundheitsdaten." };
        },
        duration: 5000 }
    ]
  });

  /* ========================================= 3 · Eingabeformular (POST) + F5 */
  function kassenseite(gedrueckt) {
    return [
      { art: "titel", text: "Bestellung abschließen" },
      { art: "formular", code: '<form method="post" action="/bestellungen">', inhalt: [
        { art: "eingabe", code: '<input name="artikel">', wert: "kaffeemuehle", aktiv: false, tippt: false },
        { art: "eingabe", code: '<input name="menge">', wert: "1", aktiv: false, tippt: false },
        { art: "knopf", text: "Kostenpflichtig bestellen", gedrueckt: gedrueckt }
      ] }
    ];
  }
  var POST_BESTELLUNG = ["POST /bestellungen HTTP/1.1", "Host: shop.example.com",
                         "Content-Type: application/x-www-form-urlencoded", "Content-Length: 31",
                         "", "artikel=kaffeemuehle&menge=1"];
  var DANKE = ["HTTP/1.1 200 OK", "Content-Type: text/html; charset=utf-8", "", "<!DOCTYPE html> … Danke für Deine Bestellung …"];
  function kasse() {
    var s = start();
    s.adresse = "https://shop.example.com/kasse";
    s.seite = kassenseite(false);
    return s;
  }

  sim.registerScenario({
    id: "formular",
    title: "Ein Eingabeformular – und dann F5",
    description: "POST verändert etwas. Was passiert, wenn die Seite neu geladen wird?",
    state: kasse,
    steps: [
      { title: "Ein Formular mit method=\"post\"",
        text: "<p>Dieses Formular <b>verändert</b> etwas – es legt eine Bestellung an. Deshalb <code>POST</code>.</p><p>Beim Server ist noch nichts angekommen.</p>",
        apply: function (s) { takt(s); } },
      { title: "Absenden",
        text: "<p>Jetzt steht die Eingabe <b>im Body</b>, nicht in der Adresse. <code>Content-Type</code> sagt, in welchem Format.</p><p>Die Nachricht ist unterwegs – beim Server ist sie noch nicht.</p>",
        apply: function (s) {
          takt(s);
          s.seite = kassenseite(true);
          sende(s, { zeilen: POST_BESTELLUNG });
        } },
      { title: "Der Server empfängt sie und legt die Bestellung an",
        text: "<p>Genau das ist der Unterschied zu vorhin: <b>Es ist etwas passiert.</b> Im Bestand steht jetzt eine Bestellung, die vorher nicht da war.</p><p>Diesen Schritt nimmt niemand zurück, indem er die Nachricht vergisst.</p>",
        apply: function (s) {
          takt(s);
          s.seite = kassenseite(false);
          tut(s, "empfangen", "POST /bestellungen");
          tut(s, "verarbeitet", "Bestellung 4711 angelegt");
          s.bestand.push({ id: "4711", label: "Nr. 4711", name: "Kaffeemühle", wert: "1 Stück" });
        } },
      { title: "Die Antwort ist die Dankeseite",
        text: "<p><code>200 OK</code> mit der Bestätigung im Body. Klingt vernünftig – und ist der Fehler.</p>",
        apply: function (s) {
          takt(s);
          tut(s, "gesendet", "200 OK · Dankeseite");
          sende(s, { rueck: true, zeilen: DANKE });
        } },
      { title: "Der Browser merkt sich, wie diese Seite entstand",
        text: "<p>In der Adresszeile steht <code>/bestellungen</code> – aber diese Seite ist die Antwort auf ein <b>POST</b>. Der Browser weiß das und behält die abgeschickten Daten.</p>",
        apply: function (s) {
          takt(s);
          s.adresse = "https://shop.example.com/bestellungen";
          s.adresseNeu = true;
          s.seite = [
            { art: "titel", text: "Danke für Deine Bestellung!" },
            { art: "text",  text: "Bestellnummer 4711" }
          ];
        } },
      { title: "Jemand drückt F5",
        text: "<p>Aus Gewohnheit, wegen einer schlechten Verbindung, oder weil der Zurück-Knopf danebenlag.</p><p><b>Was soll der Browser jetzt tun?</b> Er kann die Seite nur neu holen, indem er wiederholt, was zu ihr geführt hat.</p>",
        apply: function (s) {
          takt(s);
          s.adresseNeu = false;
          s.taste = { text: "F5", was: "neu laden", t: s.t };
          s.hinweis = { text: "<b>Formular erneut senden?</b> Die Daten werden noch einmal übertragen." };
        } },
      { title: "Der POST geht ein zweites Mal raus",
        text: "<p>Derselbe Body, dieselbe Adresse. <b>Vergleiche die beiden Einträge im Protokoll</b> – sie sind nicht zu unterscheiden.</p>",
        apply: function (s) {
          takt(s);
          s.hinweis = null;
          sende(s, { warn: true, zeilen: POST_BESTELLUNG });
        } },
      { title: "Der Server legt eine zweite Bestellung an",
        text: "<p>Er kann nicht erkennen, dass dieselbe Bestellung gemeint ist – für ihn ist es eine neue.</p><p>Das ist kein Fehler des Servers: <b>Die Nachricht sagt ihm nichts anderes.</b></p>",
        apply: function (s) {
          takt(s);
          tut(s, "empfangen", "POST /bestellungen");
          tut(s, "verarbeitet", "Bestellung 4712 angelegt", true);
          s.bestand.push({ id: "4712", label: "Nr. 4712", name: "Kaffeemühle", wert: "1 Stück", fehler: true });
        } },
      { title: "Und die Antwort kommt genauso wie beim ersten Mal",
        text: "<p><code>200 OK</code>, Dankeseite, neue Bestellnummer. Aus Sicht des Servers ist alles in Ordnung gelaufen – <b>zweimal</b>.</p>",
        apply: function (s) {
          takt(s);
          tut(s, "gesendet", "200 OK · Dankeseite");
          sende(s, { rueck: true, warn: true, zeilen: DANKE });
          s.seite = [
            { art: "titel", text: "Danke für Deine Bestellung!" },
            { art: "text",  text: "Bestellnummer 4712" }
          ];
        } },
      { title: "Zwei Bestellungen, eine Absicht",
        text: "<p><b>POST verändert etwas – Wiederholen ist deshalb nicht harmlos.</b></p><p>Der Browser hat sich korrekt verhalten, der Server auch. Falsch war die Antwort: Wer auf ein Formular mit der Seite antwortet, macht das <kbd>F5</kbd> zur Falle.</p>",
        apply: function (s) {
          takt(s);
          s.taste = null;
          s.hinweis = { text: "Zwei Bestellungen im Bestand – der Kunde wollte eine." };
        },
        duration: 5000 }
    ]
  });

  /* ============================================ 4 · Post/Redirect/Get */
  var GET_BESTELLUNG = ["GET /bestellungen/4711 HTTP/1.1", "Host: shop.example.com", "", "(kein Body)"];
  var BESTAETIGUNG = ["HTTP/1.1 200 OK", "Content-Type: text/html; charset=utf-8", "", "<!DOCTYPE html> … Bestellung 4711 …"];

  sim.registerScenario({
    id: "redirect",
    title: "Dasselbe mit Redirect",
    description: "Post/Redirect/Get: Der Server antwortet nicht mit der Seite, sondern mit ihrer Adresse.",
    state: kasse,
    steps: [
      { title: "Dasselbe Formular",
        text: "<p>Gleiche Ausgangslage, gleicher <code>POST</code>. Geändert wird nur <b>die Antwort des Servers</b>.</p>",
        apply: function (s) { takt(s); } },
      { title: "Absenden",
        text: "<p>Unverändert: Die Daten stehen im Body.</p>",
        apply: function (s) {
          takt(s);
          s.seite = kassenseite(true);
          sende(s, { zeilen: POST_BESTELLUNG });
        } },
      { title: "Der Server empfängt sie und legt die Bestellung an",
        text: "<p>Auch das unverändert – die Bestellung ist in der Welt.</p>",
        apply: function (s) {
          takt(s);
          s.seite = kassenseite(false);
          tut(s, "empfangen", "POST /bestellungen");
          tut(s, "verarbeitet", "Bestellung 4711 angelegt");
          s.bestand.push({ id: "4711", label: "Nr. 4711", name: "Kaffeemühle", wert: "1 Stück" });
        } },
      { title: "Und jetzt der Unterschied: ein Redirect",
        text: "<p>Der Server schickt <b>keine Seite</b>, sondern einen <b>Redirect</b>: <code>302 Found</code> und im Header <code>Location</code> – die Adresse, unter der das Ergebnis zu finden ist.</p><p>Der Body bleibt leer.</p>",
        apply: function (s) {
          takt(s);
          tut(s, "gesendet", "302 Found · Location: /bestellungen/4711");
          sende(s, { rueck: true, zeilen: ["HTTP/1.1 302 Found", "Location: /bestellungen/4711", "Content-Length: 0", "", "(kein Body)"] });
        } },
      { title: "Der Browser liest den Location-Header",
        text: "<p>Er zeigt diese Antwort <b>nie an</b> – es gibt nichts anzuzeigen. Stattdessen liest er den Header <code>Location</code> aus.</p><p>Beim Server ist in diesem Schritt nichts los: <b>Der Browser ist am Zug.</b></p>",
        apply: function (s) {
          takt(s);
          s.hinweis = { art: "lesen", text: "Location: /bestellungen/4711 → dorthin, mit GET" };
        } },
      { title: "Der Browser stellt die zweite Anfrage",
        text: "<p>Ohne Rückfrage, ohne Zutun des Nutzers – und zwar mit einem <b><code>GET</code></b>. Das ist der ganze Trick.</p><p>Im Protokoll stehen jetzt drei Nachrichten statt einer.</p>",
        apply: function (s) {
          takt(s);
          s.hinweis = null;
          sende(s, { zeilen: GET_BESTELLUNG });
        } },
      { title: "Der Server lädt die Bestellung",
        text: "<p>Er legt <b>nichts Neues</b> an – er liest, was schon da ist. Der Bestand bleibt bei einer Bestellung.</p>",
        apply: function (s) {
          takt(s);
          tut(s, "empfangen", "GET /bestellungen/4711");
          tut(s, "verarbeitet", "Bestellung 4711 gelesen");
        } },
      { title: "Jetzt kommt die Seite",
        text: "<p><code>200 OK</code> mit der Bestätigung – als Antwort auf ein <code>GET</code>.</p>",
        apply: function (s) {
          takt(s);
          tut(s, "gesendet", "200 OK · Bestätigung");
          sende(s, { rueck: true, zeilen: BESTAETIGUNG });
        } },
      { title: "Die Adresszeile zeigt das Ergebnis",
        text: "<p><code>/bestellungen/4711</code> – eine Adresse, die man verschicken und als Lesezeichen speichern kann. Die Bestellung hat jetzt einen Ort.</p>",
        apply: function (s) {
          takt(s);
          s.adresse = "https://shop.example.com/bestellungen/4711";
          s.adresseNeu = true;
          s.seite = [
            { art: "titel", text: "Bestellung 4711" },
            { art: "text",  text: "Kaffeemühle, 1 Stück" },
            { art: "text",  text: "Status: in Bearbeitung" }
          ];
        } },
      { title: "F5 – und diesmal nur ein GET",
        text: "<p>Der Browser wiederholt die <b>letzte</b> Nachricht, die zu dieser Seite geführt hat. Das ist der <code>GET</code>, nicht der <code>POST</code>.</p>",
        apply: function (s) {
          takt(s);
          s.adresseNeu = false;
          s.taste = { text: "F5", was: "neu laden – ohne Rückfrage", t: s.t };
          sende(s, { zeilen: GET_BESTELLUNG });
        } },
      { title: "Der Server liest noch einmal und antwortet",
        text: "<p>Er arbeitet die Anfrage vollständig ab – <b>lesen, antworten</b>. Nur legt er dabei nichts an.</p><p>Der Bestand zeigt weiterhin <b>eine</b> Bestellung.</p>",
        apply: function (s) {
          takt(s);
          tut(s, "empfangen", "GET /bestellungen/4711");
          tut(s, "verarbeitet", "Bestellung 4711 gelesen");
          tut(s, "gesendet", "200 OK · Bestätigung");
          sende(s, { rueck: true, zeilen: BESTAETIGUNG });
          s.hinweis = { art: "ok", text: "<b>Neu geladen.</b> Nur ein GET – der Bestand ist unverändert." };
        } },
      { title: "Post/Redirect/Get",
        text: "<p>Drei Nachrichten statt einer – und das <kbd>F5</kbd>-Problem ist weg.</p><p>Denselben Griff sieht man auf Startseiten: <code>/</code> leitet auf <code>/de/start</code> weiter.</p>",
        apply: function (s) {
          takt(s);
          s.taste = null;
          s.hinweis = null;
          s.marke = "eine Bestellung · Adresse teilbar · F5 harmlos";
        },
        duration: 5000 }
    ]
  });
})();
