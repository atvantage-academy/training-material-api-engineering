/* Skript der Seite 12-hypermedia-und-hal/simulation.md – über `scripts:` im Front Matter geladen. */
(function () {
  "use strict";
  var sim = window.skr.ext.didaktikon.simulation;

  function start() {
    return {
      knoepfe: [],
      herkunft: "",
      json: "",
      leitung: "",
      server: [
        { schluessel: "status", label: "Status", name: "offen", wert: "" },
        { schluessel: "regel",  label: "Regel",  name: "stornieren erlaubt, solange nicht bezahlt", wert: "" }
      ]
    };
  }

  function zeichne(s, ctx) {
    var sz = ctx.scenario;

    sim.list(document.getElementById(sz + "-knoepfe"), s.knoepfe, {
      animated: ctx.animated,
      key: function (x) { return x.id; },
      create: function () {
        var el = document.createElement("div");
        el.className = "kn__knopf";
        el.innerHTML = '<span></span><small></small>';
        return el;
      },
      update: function (el, x) {
        el.querySelector("span").textContent = x.text;
        el.querySelector("small").textContent = x.ziel;
        el.classList.toggle("is-error", !!x.tot);
        el.classList.toggle("is-pulse", !!x.tot);
      }
    });

    var leer = document.getElementById(sz + "-knoepfe");
    if (leer && !s.knoepfe.length && !leer.querySelector(".kn__leer")) {
      leer.insertAdjacentHTML("beforeend", '<p class="kn__leer">noch nichts geladen</p>');
    }
    if (leer && s.knoepfe.length) {
      var weg = leer.querySelector(".kn__leer");
      if (weg) weg.remove();
    }

    document.getElementById(sz + "-herkunft").innerHTML = s.herkunft;
    document.getElementById(sz + "-leitung").innerHTML = s.leitung;

    var json = document.getElementById(sz + "-json");
    if (json.textContent !== s.json) {
      json.textContent = s.json;
      if (ctx.animated) sim.pulse(json.parentNode);
    }

    sim.list(document.getElementById(sz + "-server"), s.server, {
      animated: ctx.animated,
      key: function (x) { return x.schluessel + "-" + x.name; },
      create: function () {
        var el = document.createElement("div");
        el.className = "skr-didaktikon-simulation-cell";
        el.innerHTML = '<span class="skr-didaktikon-simulation-cell__label"></span>' +
                       '<span class="skr-didaktikon-simulation-cell__name"></span>' +
                       '<span class="skr-didaktikon-simulation-cell__value"></span>';
        return el;
      },
      update: function (el, x) {
        el.querySelector(".skr-didaktikon-simulation-cell__label").textContent = x.label;
        el.querySelector(".skr-didaktikon-simulation-cell__name").textContent = x.name;
        el.querySelector(".skr-didaktikon-simulation-cell__value").textContent = x.wert || "";
        el.classList.toggle("is-active", !!x.aktiv);
        el.classList.toggle("is-error", !!x.konflikt);
      }
    });
  }

  /* ============================================================ Ohne Hypermedia */

  var JSON_OFFEN =
    '{\n' +
    '  "id": "4711",\n' +
    '  "status": "offen",\n' +
    '  "summe": 84.50\n' +
    '}';

  var JSON_BEZAHLT =
    '{\n' +
    '  "id": "4711",\n' +
    '  "status": "bezahlt",\n' +
    '  "summe": 84.50\n' +
    '}';

  sim.registerScenario({
    id: "ohne",
    title: "Ohne Hypermedia",
    description: "Die Antwort trägt nur Daten. Welche Knöpfe erlaubt sind, steht im Client – als if-Abfrage.",
    state: start,
    render: zeichne,
    steps: [
      {
        title: "Die Ausgangslage",
        text: "<p>Bestellung <b>4711</b>, Status <b>offen</b>, 84,50 €. Der Kunde hat sie gerade abgeschickt.</p>" +
              "<p>Auf dem Server steht die fachliche Regel: <b>Stornieren geht, solange nicht bezahlt ist.</b> Merk sie Dir – gleich steht sie an einer zweiten Stelle noch einmal.</p>",
        apply: function () {}
      },
      {
        title: "Der Client holt die Bestellung",
        text: "<p><code>GET /orders/4711</code>. Die Antwort enthält, was eine ganz normale JSON-API liefert: <b>Daten, sonst nichts.</b></p>",
        apply: function (s) {
          s.leitung = "GET /orders/4711 → <strong>200 OK</strong>";
          s.json = JSON_OFFEN;
        }
      },
      {
        title: "Und jetzt entscheidet der Client",
        text: "<p>Aus <code>status: \"offen\"</code> allein folgt kein Knopf. Also steht im Client eine Abfrage: <i>wenn offen, dann zeige Bezahlen und Stornieren.</i></p>" +
              "<p><b>Die Adressen kennt er ebenfalls auswendig</b> – sie sind beim Entwickeln aus der Dokumentation abgeschrieben worden.</p>",
        apply: function (s) {
          s.knoepfe = [
            { id: "pay",    text: "Bezahlen",   ziel: "POST /orders/4711/payment" },
            { id: "cancel", text: "Stornieren", ziel: "DELETE /orders/4711" }
          ];
          s.herkunft = 'aus dem Client-Code:<br><code>if (status === "offen") { … }</code>';
        }
      },
      {
        title: "Der Kunde bezahlt",
        text: "<p><code>POST /orders/4711/payment</code> – der Server nimmt die Zahlung an und setzt den Status auf <b>bezahlt</b>.</p>",
        apply: function (s) {
          s.leitung = "POST /orders/4711/payment → <strong>200 OK</strong>";
          s.json = JSON_BEZAHLT;
          s.server[0] = { schluessel: "status", label: "Status", name: "bezahlt", wert: "", aktiv: true };
          s.knoepfe = [
            { id: "cancel", text: "Stornieren", ziel: "DELETE /orders/4711" },
            { id: "invoice", text: "Rechnung", ziel: "GET /orders/4711/invoice" }
          ];
          s.herkunft = 'aus dem Client-Code:<br><code>if (status === "bezahlt") { … }</code>';
        }
      },
      {
        title: "Ein halbes Jahr später ändert sich die Regel",
        text: "<p>Der Fachbereich entscheidet: <b>Nach Zahlungseingang wird nicht mehr storniert</b> – dafür gibt es die Retoure. Der Server setzt das noch am selben Tag durch.</p>" +
              "<p>Der Client weiß davon nichts. <b>Er zeigt den Knopf weiter.</b></p>",
        apply: function (s) {
          s.server[0].aktiv = false;
          s.server[1] = { schluessel: "regel", label: "Regel", name: "stornieren nur vor Zahlungseingang", wert: "neu", aktiv: true };
          s.knoepfe[0].tot = true;
          s.leitung = "";
        }
      },
      {
        title: "Der Nutzer klickt – und bekommt einen Fehler",
        text: "<p><code>DELETE /orders/4711</code> → <b>409 Conflict</b>. Der Server hat recht, der Client hatte unrecht, und der Kunde hat einen Knopf gedrückt, den es nicht hätte geben dürfen.</p>" +
              "<p>Das ist <b>kein Programmierfehler</b>. Der Client tut genau das, was vor sechs Monaten richtig war.</p>",
        apply: function (s) {
          s.leitung = "DELETE /orders/4711 → <strong>409 Conflict</strong>";
          s.json = '{\n  "type": "…/order-already-paid",\n  "title": "Bezahlte Bestellung",\n  "status": 409\n}';
          s.server[1].konflikt = true;
        }
      },
      {
        title: "Und das dreimal",
        text: "<p>Es gibt nicht einen Client, sondern <b>drei</b>: die Weboberfläche, die App im Store und den Partner, der die API selbst anspricht.</p>" +
              "<p>Dieselbe Abfrage steht dreimal an drei Stellen. Sie muss dreimal geändert, dreimal getestet und dreimal ausgeliefert werden – und beim Partner entscheidet <b>er</b>, wann.</p>",
        apply: function (s) {
          s.herkunft = 'dieselbe Abfrage steht in:<br><code>web-ui</code> · <code>mobile-app</code> · <code>partner-client</code>';
          s.leitung = "";
        }
      },
      {
        title: "Der Zustand steht rechts, die Regel dazu links",
        text: "<p><b>Der Server kennt den Zustand. Was in diesem Zustand erlaubt ist, weiß der Client.</b> Solange beide dasselbe denken, fällt das nicht auf – und genau deshalb fällt es erst auf, wenn es zu spät ist.</p>" +
              "<p>Der Fehler ist nicht die <code>if</code>-Abfrage. Der Fehler ist, dass die Antwort dem Client nichts mitgibt, woran er sich halten könnte.</p>",
        apply: function (s) { s.leitung = ""; },
        duration: 6500
      }
    ]
  });

  /* ============================================================ Mit Hypermedia */

  var HAL_OFFEN =
    '{\n' +
    '  "id": "4711",\n' +
    '  "status": "offen",\n' +
    '  "summe": 84.50,\n' +
    '  "_links": {\n' +
    '    "self":   {"href": "/orders/4711"},\n' +
    '    "pay":    {"href": "/orders/4711/payment"},\n' +
    '    "cancel": {"href": "/orders/4711"}\n' +
    '  }\n' +
    '}';

  var HAL_BEZAHLT =
    '{\n' +
    '  "id": "4711",\n' +
    '  "status": "bezahlt",\n' +
    '  "summe": 84.50,\n' +
    '  "_links": {\n' +
    '    "self":    {"href": "/orders/4711"},\n' +
    '    "invoice": {"href": "/orders/4711/invoice"},\n' +
    '    "return":  {"href": "/orders/4711/returns"}\n' +
    '  }\n' +
    '}';

  var HAL_NEUE_ADRESSE =
    '{\n' +
    '  "id": "4711",\n' +
    '  "status": "offen",\n' +
    '  "summe": 84.50,\n' +
    '  "_links": {\n' +
    '    "self":   {"href": "/orders/4711"},\n' +
    '    "pay":    {"href": "/payments?order=4711"},\n' +
    '    "cancel": {"href": "/orders/4711"}\n' +
    '  }\n' +
    '}';

  sim.registerScenario({
    id: "mit",
    title: "Mit Hypermedia",
    description: "Dieselbe Bestellung – aber die Antwort sagt, was gerade geht. Der Client baut seine Knöpfe daraus.",
    state: start,
    render: zeichne,
    steps: [
      {
        title: "Dieselbe Ausgangslage",
        text: "<p>Bestellung <b>4711</b>, Status <b>offen</b>, dieselbe Regel auf dem Server. Auch der Client ist derselbe – <b>eine Sache macht er anders</b>.</p>" +
              "<p>Er hat keine Abfrage auf den Status. Er zeigt einfach an, was in der Antwort steht.</p>",
        apply: function () {}
      },
      {
        title: "Die Antwort bringt Verweise mit",
        text: "<p><code>GET /orders/4711</code> – dieselben Daten wie eben, dazu ein Block <code>_links</code>. Das ist <b>HAL</b>: ein schlichtes Format für genau diese Verweise, Medientyp <code>application/hal+json</code>.</p>" +
              "<p><code>self</code> ist die eigene Adresse, <code>pay</code> und <code>cancel</code> sind <b>das, was jetzt geht</b>.</p>",
        apply: function (s) {
          s.leitung = "GET /orders/4711 → <strong>200 OK</strong>";
          s.json = HAL_OFFEN;
        }
      },
      {
        title: "Der Client zeichnet, was da ist",
        text: "<p>Zwei Verweise außer <code>self</code>, also zwei Knöpfe. <b>Keine Abfrage auf den Status</b>, keine zusammengebaute Adresse – die steht im <code>href</code>.</p>" +
              "<p>Der Client kennt die <b>Wörter</b> <code>pay</code> und <code>cancel</code> und weiß, wie er sie beschriftet. Mehr braucht er nicht.</p>",
        apply: function (s) {
          s.knoepfe = [
            { id: "pay",    text: "Bezahlen",   ziel: "_links.pay.href" },
            { id: "cancel", text: "Stornieren", ziel: "_links.cancel.href" }
          ];
          s.herkunft = 'aus der Antwort:<br><code>Object.keys(antwort._links)</code>';
        }
      },
      {
        title: "Der Kunde bezahlt",
        text: "<p>Der Client schickt sein <code>POST</code> an die Adresse aus <code>_links.pay.href</code> – <b>er hat sie nirgends gespeichert</b>, er hat sie eben erst bekommen.</p>" +
              "<p>Die Antwort ist die neue Darstellung der Bestellung: Status <b>bezahlt</b> – und ein anderer <code>_links</code>-Block.</p>",
        apply: function (s) {
          s.leitung = "POST /orders/4711/payment → <strong>200 OK</strong>";
          s.json = HAL_BEZAHLT;
          s.server[0] = { schluessel: "status", label: "Status", name: "bezahlt", wert: "", aktiv: true };
        }
      },
      {
        title: "Der Storno-Knopf verschwindet von selbst",
        text: "<p><code>cancel</code> steht nicht mehr in der Antwort – also zeichnet der Client ihn nicht. Dafür sind <code>invoice</code> und <code>return</code> dazugekommen.</p>" +
              "<p><b>Niemand hat den Client angefasst.</b> Er weiß bis heute nicht, dass es eine Regel „nur vor Zahlungseingang“ überhaupt gibt.</p>",
        apply: function (s) {
          s.knoepfe = [
            { id: "invoice", text: "Rechnung",  ziel: "_links.invoice.href" },
            { id: "return",  text: "Retoure",   ziel: "_links.return.href" }
          ];
          s.server[0].aktiv = false;
        }
      },
      {
        title: "Jetzt die Regeländerung von vorhin",
        text: "<p>Der Fachbereich verschärft: <b>Stornieren nur noch in den ersten 15 Minuten.</b> Der Server nimmt <code>cancel</code> danach einfach nicht mehr in die Antwort auf.</p>" +
              "<p>Alle drei Clients ziehen mit – <b>ohne Release, ohne Test, ohne Absprache mit dem Partner</b>. Die Regel steht an genau einer Stelle.</p>",
        apply: function (s) {
          s.server[1] = { schluessel: "regel", label: "Regel", name: "stornieren nur in den ersten 15 Minuten", wert: "neu", aktiv: true };
          s.herkunft = 'gilt gleichermaßen für:<br><code>web-ui</code> · <code>mobile-app</code> · <code>partner-client</code>';
          s.leitung = "";
        }
      },
      {
        title: "Nebenbei: der Server zieht um",
        text: "<p>Die Zahlung wandert in einen eigenen Service, die Adresse wird <code>/payments?order=4711</code>. <b>Im Client ändert sich nichts</b> – er hat die alte Adresse nie besessen.</p>" +
              "<p>Das ist der zweite Gewinn, und im Alltag oft der größere: <b>Adressen sind wieder Implementierungsdetail</b> statt Teil des Vertrags.</p>",
        apply: function (s) {
          s.json = HAL_NEUE_ADRESSE;
          s.leitung = "GET /orders/4711 → <strong>200 OK</strong>";
          s.server[0] = { schluessel: "status", label: "Status", name: "offen", wert: "" };
          s.server[1].aktiv = false;
          s.knoepfe = [
            { id: "pay",    text: "Bezahlen",   ziel: "_links.pay.href" },
            { id: "cancel", text: "Stornieren", ziel: "_links.cancel.href" }
          ];
        }
      },
      {
        title: "Was Hypermedia nicht abnimmt",
        text: "<p>Der Client weiß jetzt <b>wohin</b> und <b>wann</b>. Er weiß immer noch nicht, <b>was</b> <code>cancel</code> bedeutet, was er als Body mitschicken muss und was danach gilt.</p>" +
              "<p>Das steht nirgends in den Daten – es bleibt Absprache zwischen den Teams. <b>Die Verweise nehmen dem Client die Adressen ab, nicht das Vokabular.</b></p>",
        apply: function (s) {
          s.leitung = "";
          s.herkunft = 'weiterhin im Client:<br><code>„cancel“ → Knopf „Stornieren“</code>';
        },
        duration: 6500
      }
    ]
  });
})();
