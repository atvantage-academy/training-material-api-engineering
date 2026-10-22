/* Skript der Seite 03-ressourcen-und-methoden/methoden-matrix.md – über `scripts:` im Front Matter geladen. */
(function () {
  "use strict";

  var SPALTEN = [
    { id: "liste",     url: "/products",                 art: "Listenressource · Hauptressource" },
    { id: "einzeln",   url: "/products/12345",           art: "Einzelressource · Hauptressource" },
    { id: "unterliste",url: "/products/12345/images",    art: "Listenressource · Unterressource" },
    { id: "abgeleitet",url: "/products/12345/images/preview", art: "Einzelressource · Unterressource" }
  ];

  // ton: ok = tragfähig, warn = geht, will aber begründet sein, no = ergibt keinen Sinn
  var ZELLEN = {
    "GET|liste":        { mark: "R", wort: "Read", ton: "ok",
      urteil: "Der Normalfall",
      text: "Die Liste lesen – mit Filtern, Sortierung und Paginierung als Query-Parameter. GET ist <em>sicher</em>: Es verändert nichts, deshalb dürfen Caches und Suchmaschinen es ungefragt ausführen.",
      bsp: "GET /products?category=books&page=1\n200 OK" },
    "GET|einzeln":      { mark: "R", wort: "Read", ton: "ok",
      urteil: "Der Normalfall",
      text: "Eine Einzelressource lesen. Gibt es die ID nicht, ist die Antwort <code>404</code> – nicht <code>200</code> mit einem leeren Objekt.",
      bsp: "GET /products/12345\n200 OK\n404 Not Found" },
    "GET|unterliste":   { mark: "R", wort: "Read", ton: "warn",
      urteil: "Ja – aber frag Dich, warum es sie gibt",
      text: "Technisch unstrittig. Die eigentliche Entwurfsfrage ist eine andere: Warum ist <code>images</code> überhaupt eine eigene Adresse und nicht ein Feld im Produkt? Gute Gründe: Es sind viele, sie sind groß, sie ändern sich unabhängig, oder sie haben eigene Rechte. Kein guter Grund: „so liegt es in der Datenbank“.",
      bsp: "GET /products/12345/images\n200 OK" },
    "GET|abgeleitet":   { mark: "R", wort: "Read", ton: "ok",
      urteil: "Der klassische Fall für eine abgeleitete Ressource",
      text: "Das Vorschaubild zu den Bildern dieses Produkts – nichts Gespeichertes, sondern etwas Berechnetes, und trotzdem eine Ressource: Es hat eine Adresse, ist lesbar und cachebar. Genau dafür ist REST gut. Der häufige Anfängerfehler wäre <code>POST /products/12345/images/generatePreview</code>: ein Verb in der URL für etwas, das man einfach lesen kann.<br><br>Beachte, wo sie hängt: <strong>unter</strong> der Bilderliste, nicht neben ihr. Die Vorschau gibt es nur, weil es die Bilder gibt.",
      bsp: "GET /products/12345/images/preview\n200 OK\nContent-Type: image/png" },

    "POST|liste":       { mark: "C", wort: "Create", ton: "ok",
      urteil: "Der Normalfall zum Anlegen",
      text: "POST heißt: „Wende Deine eigene Logik auf das Mitgeschickte an.“ Bei einer Liste ist das „nimm es auf“ – <strong>und vergib die ID</strong>. Deshalb ist POST nicht idempotent: Zweimal gesendet, zweimal angelegt. Die Antwort ist <code>201</code> mit einem <code>Location</code>-Header auf das Neue.",
      bsp: "POST /products\n{ \"name\": \"Kaffeemühle\" }\n\n201 Created\nLocation: /products/12345" },
    "POST|einzeln":     { mark: "✗", wort: "ohne Bedeutung", ton: "no",
      urteil: "Nicht verboten – aber es gibt nichts zu tun",
      text: "Was sollte „wende Deine Logik auf das Mitgeschickte an“ bei einem <em>bestimmten</em> Produkt bedeuten? Es gibt nichts, dem man etwas hinzufügen könnte. Antwort: <code>405 Method Not Allowed</code>.<br><br><strong>Die Ausnahme, die Du kennen solltest:</strong> POST auf eine Einzelressource ist der übliche Griff für <em>Aktionen</em>, die keine CRUD-Operation sind – <code>POST /orders/77/actions/cancel</code>. Dann adressiert man aber die Aktion als eigene <strong>Aktionsressource</strong>, nicht die Einzelressource selbst.",
      bsp: "POST /products/12345\n405 Method Not Allowed" },
    "POST|unterliste":  { mark: "C", wort: "Create", ton: "ok",
      urteil: "Der Normalfall zum Hinzufügen",
      text: "Ein Bild hinzufügen, der Server vergibt die ID. Identisch zur Hauptliste – eine Unterliste ist eine Liste.",
      bsp: "POST /products/12345/images\n201 Created\nLocation: /products/12345/images/7" },
    "POST|abgeleitet":  { mark: "✗", wort: "ohne Bedeutung", ton: "no",
      urteil: "Es gibt nichts anzulegen",
      text: "Die Vorschau ist berechnet – sie entsteht nicht dadurch, dass jemand sie einreicht. Wer hier POST braucht, hat in Wahrheit eine Aktion gemeint („neu berechnen“). Die gehört dann als eigene Ressource modelliert, oder sie ist gar nicht nötig: Beim nächsten GET ist sie ohnehin aktuell.",
      bsp: "POST /products/12345/images/preview\n405 Method Not Allowed" },

    "PUT|liste":        { mark: "U?", wort: "Replace", ton: "warn",
      urteil: "Definiert, aber gefährlich",
      text: "PUT ersetzt die Ressource <em>vollständig</em> durch das Mitgeschickte. Auf einer Liste heißt das: „Ab jetzt sind das alle Produkte, die es gibt.“ Das ist eindeutig definiert – und selten das, was jemand will. Wer es anbietet, sollte sehr genau wissen, warum.",
      bsp: "PUT /products\n[ … alle Produkte … ]\n\n→ alles, was nicht dabei ist, ist weg" },
    "PUT|einzeln":      { mark: "U/C", wort: "Replace / Create", ton: "ok",
      urteil: "Ersetzen – und anlegen, wenn der Client die ID bestimmt",
      text: "PUT ist <em>idempotent</em>: Dieselbe Anfrage zweimal führt zum selben Zustand. Deshalb ist PUT der richtige Griff, wenn der <strong>Client</strong> die ID kennt – etwa bei einem fachlichen Schlüssel. Achtung beim Ersetzen: Was Du nicht mitschickst, ist danach weg.",
      bsp: "PUT /customers/john@acme.com\n{ \"name\": \"John\" }\n\n201 beim ersten Mal, 200/204 danach" },
    "PUT|unterliste":   { mark: "U?", wort: "Replace", ton: "warn",
      urteil: "Hier oft sinnvoller als auf der Hauptliste",
      text: "„Genau diese Bilder soll das Produkt haben“ ist ein realistischer Wunsch – und die Menge ist überschaubar und gehört einem einzigen Besitzer. Das ist der Unterschied zur globalen Liste: Der Schaden ist begrenzt und der Besitzer ist eindeutig.",
      bsp: "PUT /products/12345/images\n[ … die gewünschten Bilder … ]" },
    "PUT|abgeleitet":   { mark: "U/C", wort: "Replace / Create", ton: "warn",
      urteil: "Nur, wenn die Vorschau hinterlegbar ist",
      text: "Ist die Vorschau rein berechnet, gibt es nichts zu setzen – dann <code>405</code>. Darf man sie aber überschreiben („nimm dieses Bild statt des automatisch erzeugten“), ist PUT genau richtig: Es gibt <strong>eine</strong> davon, der Client bestimmt den Inhalt, mehrfach gesendet ändert sich nichts.",
      bsp: "PUT /products/12345/images/preview\nContent-Type: image/png\n204 No Content" },

    "PATCH|liste":      { mark: "U", wort: "Update", ton: "warn",
      urteil: "Möglich, aber ungewöhnlich",
      text: "PATCH auf eine Liste bedeutet „ändere etwas an der Liste, ohne sie zu ersetzen“ – dafür braucht man ein Änderungsformat (JSON Patch, <code>application/json-patch+json</code>). Das ist mächtig und schwer verständlich. In den meisten Entwürfen kommt es nicht vor.",
      bsp: "PATCH /products\nContent-Type: application/json-patch+json" },
    "PATCH|einzeln":    { mark: "U", wort: "Update", ton: "ok",
      urteil: "Der Normalfall zum Ändern einzelner Felder",
      text: "Der Unterschied zu PUT in einem Satz: <strong>PUT ersetzt, PATCH ändert.</strong> Kunde 5 heißt „Maier“ mit Vorname „Tom“. <code>PUT</code> mit <code>{\"name\":\"Schmidt\"}</code> → Vorname ist weg. <code>PATCH</code> mit demselben Body → Vorname bleibt. Dafür ist PATCH aufwendiger zu implementieren (Zusammenführen) und nicht automatisch idempotent.",
      bsp: "PATCH /products/12345\nContent-Type: application/merge-patch+json\n{ \"price\": 19.90 }" },
    "PATCH|unterliste": { mark: "U", wort: "Update", ton: "warn",
      urteil: "Wie bei der Hauptliste – selten",
      text: "Dasselbe Bild wie oben: Es braucht ein Änderungsformat, und meist ist es einfacher, das einzelne Element zu ändern (<code>PATCH /products/12345/images/7</code>).",
      bsp: "PATCH /products/12345/images" },
    "PATCH|abgeleitet": { mark: "U", wort: "Update", ton: "warn",
      urteil: "Nur, wenn sie überhaupt Felder hat",
      text: "Ein Bild hat keine Teilfelder, die man einzeln ändern könnte – dann ergibt PATCH keinen Sinn. Ist die Vorschau dagegen ein Objekt mit Einstellungen (Ausschnitt, Größe), ist PATCH der übliche Weg.",
      bsp: "PATCH /products/12345/images/preview\n{ \"crop\": \"square\" }" },

    "DELETE|liste":     { mark: "✗", wort: "geht nicht", ton: "no",
      urteil: "Löschen und Leeren sind nicht dasselbe",
      text: "Eine Ressource zu löschen heißt: Sie ist danach <strong>weg</strong> – ein anschließendes <code>GET</code> antwortet <code>404</code>. Genau das lässt sich mit einer Listenressource nicht machen. <code>/products</code> ist die Produktliste des Shops; sie existiert, solange es den Shop gibt – ob Produkte darin stehen oder keine. Nach einem <code>DELETE</code> wäre sie also immer noch da, nur leer. Und eine leere Liste antwortet <code>200</code> mit <code>[]</code>, nicht <code>404</code>.<br><br>Wer hier DELETE verlangt, meint deshalb nicht <em>löschen</em>, sondern <strong>leeren</strong> – und dafür ist DELETE die falsche Methode. Die Aufgabe bleibt damit aber bestehen: <em>Wie leert man eine Liste?</em> Drei Entwürfe stehen unter der Matrix.",
      bsp: "DELETE /products\n405 Method Not Allowed\n\nGET /products\n200 OK\n[]   ← die Liste gibt es weiterhin" },
    "DELETE|einzeln":   { mark: "D", wort: "Delete", ton: "ok",
      urteil: "Der Normalfall",
      text: "Löschen, Antwort <code>204</code> ohne Body. DELETE ist <em>idempotent</em>: Beim zweiten Mal ist die Ressource immer noch weg – ob man dann <code>204</code> oder <code>404</code> antwortet, ist eine Entwurfsentscheidung. (Zweimal senden darf jedenfalls nicht zwei verschiedene Ressourcen löschen – genau das ist der Grund, warum <code>DELETE /customers/oldest</code> ein Fehler ist.)",
      bsp: "DELETE /products/12345\n204 No Content" },
    "DELETE|unterliste":{ mark: "✗", wort: "geht nicht", ton: "no",
      urteil: "Unterressource hin oder her – es bleibt eine Liste",
      text: "Der naheliegende Einwand lautet: Hier ist der Schaden doch begrenzt – die Bilder gehören einem einzigen Produkt, ein Versehen trifft nicht den ganzen Katalog. Das stimmt, trifft aber die Sache nicht. Der Grund ist derselbe wie bei <code>/products</code>: <code>/products/12345/images</code> <strong>ist</strong> eine Listenressource. Sie existiert, solange es das Produkt gibt. Löschte man sie wirklich, müsste das nächste <code>GET</code> mit <code>404</code> antworten – es antwortet aber <code>200</code> mit <code>[]</code>.<br><br>Gemeint ist also auch hier <strong>leeren</strong>. Die drei Entwürfe unter der Matrix gelten unverändert, nur lautet die Adresse dann <code>/products/12345/images</code>. <em>Die Unterscheidung Haupt- gegen Unterressource hilft hier nicht weiter – die Unterscheidung Listen- gegen Einzelressource schon.</em>",
      bsp: "DELETE /products/12345/images\n405 Method Not Allowed\n\nGET /products/12345/images\n200 OK\n[]" },
    "DELETE|abgeleitet":{ mark: "D", wort: "Delete", ton: "warn",
      urteil: "Nur, wenn es etwas zu löschen gibt",
      text: "Bei einer rein berechneten Vorschau: nichts zu löschen, <code>405</code>. Bei einer hinterlegten: „nimm meine hochgeladene Vorschau weg und berechne wieder selbst“ – das ist eine saubere Bedeutung für DELETE.",
      bsp: "DELETE /products/12345/images/preview\n204 No Content" }
  };

  var METHODEN = ["GET", "POST", "PUT", "PATCH", "DELETE"];

  var wurzel = document.querySelector(".mm");
  if (!wurzel) return;
  var tabelle = wurzel.querySelector("[data-mm-grid] tbody");
  var detail = wurzel.querySelector("[data-mm-detail]");
  var zaehler = wurzel.querySelector("[data-mm-count]");
  var knoepfe = [];

  METHODEN.forEach(function (methode) {
    var zeile = document.createElement("tr");
    var kopf = document.createElement("th");
    kopf.scope = "row";
    kopf.textContent = methode;
    zeile.appendChild(kopf);

    SPALTEN.forEach(function (spalte) {
      var zelle = document.createElement("td");
      var daten = ZELLEN[methode + "|" + spalte.id];
      var knopf = document.createElement("button");
      knopf.type = "button";
      knopf.className = "mm__cell";
      knopf.setAttribute("aria-pressed", "false");
      knopf.setAttribute("aria-label", methode + " auf " + spalte.url + " – aufdecken");
      knopf.innerHTML = '<span class="mm__mark">?</span><span class="mm__word"></span>';
      knopf.addEventListener("click", function () { oeffne(knopf, methode, spalte, daten); merken(); });
      knopf._mm = { methode: methode, spalte: spalte, daten: daten };
      /* Kennung fuer die Adresse: `get-liste` statt einer Zellennummer. */
      knopf.dataset.mmId = (methode + "-" + spalte.id).toLowerCase();
      knoepfe.push(knopf);
      zelle.appendChild(knopf);
      zeile.appendChild(zelle);
    });

    tabelle.appendChild(zeile);
  });

  function decke(knopf) {
    var d = knopf._mm;
    if (knopf.classList.contains("is-open")) return false;
    knopf.classList.add("is-open", "t-" + d.daten.ton);
    knopf.querySelector(".mm__mark").textContent = d.daten.mark;
    knopf.querySelector(".mm__word").textContent = d.daten.wort;
    knopf.setAttribute("aria-label", d.methode + " auf " + d.spalte.url + ": " + d.daten.urteil);
    return true;
  }

  function oeffne(knopf, methode, spalte, daten) {
    decke(knopf);
    knoepfe.forEach(function (k) { k.setAttribute("aria-pressed", k === knopf ? "true" : "false"); });
    detail.innerHTML =
      '<h3><code>' + methode + " " + spalte.url + "</code></h3>" +
      '<p class="mm__verdict t-' + daten.ton + '">' + daten.urteil + "</p>" +
      "<p>" + daten.text + "</p>" +
      '<code class="mm__ex">' + daten.bsp.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</code>";
    zaehle();
  }

  function zaehle() {
    var offen = knoepfe.filter(function (k) { return k.classList.contains("is-open"); }).length;
    zaehler.textContent = offen + " von " + knoepfe.length + " aufgedeckt";
  }

  function verdecke(k) {
    k.className = "mm__cell";
    k.setAttribute("aria-pressed", "false");
    k.setAttribute("aria-label", k._mm.methode + " auf " + k._mm.spalte.url + " – aufdecken");
    k.querySelector(".mm__mark").textContent = "?";
    k.querySelector(".mm__word").textContent = "";
  }

  wurzel.querySelector("[data-mm-all]").addEventListener("click", function () {
    knoepfe.forEach(decke);
    zaehle();
    merken();
  });

  wurzel.querySelector("[data-mm-reset]").addEventListener("click", function () {
    knoepfe.forEach(verdecke);
    detail.innerHTML = '<p class="mm__hint">Wähle eine Zelle – die Begründung erscheint hier.</p>';
    zaehle();
    merken();
  });

  /* --- Zustand in der Adresse ---------------------------------------------
     EINE HALB AUFGEDECKTE MATRIX IST DER ZUSTAND DES GESPRAECHS. Wer im Kurs acht
     Zellen aufgedeckt hat und neu laedt, faengt sonst wieder bei zwanzig
     Fragezeichen an - und ein Verweis aus dem Regiebuch kann nicht auf
     „DELETE auf der Liste" zeigen.

     ZWEI SCHLUESSEL: `matrix` fuehrt die aufgedeckten Zellen, `zelle` die, deren
     Begruendung unten steht. Sind alle offen, steht `matrix=alle` da statt
     zwanzig Kennungen - eine Adresse, die man noch vorlesen kann.

     Angemeldet wird bei `skr.state` des Skriptoriums statt selbst ins
     Fragment zu schreiben; erst bei DOMContentLoaded, weil das Theme-Skript
     `defer` traegt. */
  function merken() { if (window.skr && window.skr.state) { window.skr.state.update(); } }

  function anmelden() {
    if (!(window.skr && window.skr.state)) { return; }

    window.skr.state.register({
      key: "matrix",
      read: function () {
        var offen = knoepfe.filter(function (k) { return k.classList.contains("is-open"); });
        if (!offen.length) { return ""; }
        if (offen.length === knoepfe.length) { return "alle"; }
        return offen.map(function (k) { return k.dataset.mmId; }).join(",");
      },
      apply: function (wert) {
        var alle = wert === "alle";
        var liste = wert ? wert.split(",") : [];
        knoepfe.forEach(function (k) {
          var soll = alle || liste.indexOf(k.dataset.mmId) !== -1;
          if (soll) { decke(k); } else { verdecke(k); }
        });
        zaehle();
      }
    });

    window.skr.state.register({
      key: "zelle",
      read: function () {
        var a = knoepfe.filter(function (k) { return k.getAttribute("aria-pressed") === "true"; })[0];
        return a ? a.dataset.mmId : "";
      },
      apply: function (wert) {
        var k = knoepfe.filter(function (x) { return x.dataset.mmId === wert; })[0];
        if (k) { oeffne(k, k._mm.methode, k._mm.spalte, k._mm.daten); }
      }
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", anmelden);
  } else {
    anmelden();
  }

  zaehle();
})();
