/* Skript der Seite 02-http-grundlagen/eigenschaften.md – über `scripts:` im Front Matter geladen. */
(function () {
  "use strict";

  var NACHRICHTEN = {
    anfrage: [
      { art: "start", zeilen: ["GET /produkte/kaffeemuehle HTTP/1.1"],
        titel: "Startzeile der Anfrage",
        text: "<strong>Methode</strong> (was soll geschehen), <strong>Pfad</strong> (womit), <strong>Version</strong>.",
        merke: "Methode und Pfad ergeben zusammen den Satz: „Hol mir die Kaffeemühle.“" },
      { art: "header", zeilen: ["Host: shop.example.com", "User-Agent: Mozilla/5.0 (Macintosh; …)", "Referer: https://shop.example.com/produkte"],
        titel: "Header der Anfrage",
        text: "Angaben <em>über</em> die Nachricht, je Zeile ein <code>Name: Wert</code>. <code>Host</code> sagt, welche Website gemeint ist – ein Server bedient oft viele.",
        merke: "Auf dem Umschlag stehen die Header – Absender, Empfänger, Hinweise. Die Post liest sie und befördert danach." },
      { art: "leer", zeilen: [""],
        titel: "Die Leerzeile",
        text: "Das <strong>einzige</strong> Trennzeichen zwischen Headern und Body. Der Empfänger liest Zeile für Zeile, bis eine leer ist – alles danach ist Inhalt.",
        merke: "Wichtiger, als sie aussieht." },
      { art: "body", zeilen: ["(kein Body – GET holt nur)"],
        titel: "Body der Anfrage",
        text: "Der <strong>Zettel im Umschlag</strong> – bei <code>GET</code> bleibt er leer, weil alles Nötige schon auf dem Umschlag steht.",
        merke: "Beim <code>POST</code> eines Formulars stehen hier die eingegebenen Daten." }
    ],
    antwort: [
      { art: "start", zeilen: ["HTTP/1.1 200 OK"],
        titel: "Startzeile der Antwort",
        text: "Erst die <strong>Version</strong>, dann der <strong>Statuscode</strong> und ein kurzer Text für Menschen.",
        merke: "<code>2xx</code> geklappt · <code>3xx</code> woanders nachsehen · <code>4xx</code> <strong>Du</strong> · <code>5xx</code> <strong>ich</strong>." },
      { art: "header", zeilen: ["Content-Type: text/html; charset=utf-8", "Content-Length: 1526", "Date: Mon, 14 Sep 2026 08:12:44 GMT"],
        titel: "Header der Antwort",
        text: "<code>Content-Type</code> sagt, <em>was</em> im Body liegt – ohne diese Zeile weiß der Browser nicht, ob er eine Seite anzeigen oder eine Datei anbieten soll.",
        merke: "Bei einem <strong>Redirect</strong> steht hier <code>Location</code>." },
      { art: "leer", zeilen: [""],
        titel: "Die Leerzeile",
        text: "Dieselbe Rolle wie in der Anfrage.",
        merke: "Der Aufbau ist in <strong>beiden Richtungen identisch</strong> – nur die Startzeile unterscheidet sich." },
      { art: "body", zeilen: ["<!DOCTYPE html>", "<html lang=\"de\"> … </html>"],
        titel: "Body der Antwort",
        text: "Der <strong>Zettel im Umschlag</strong>: der eigentliche Inhalt – hier HTML, es könnte ein Bild sein oder JSON. <em>Was</em> darauf steht, verrät der <code>Content-Type</code> auf dem Umschlag.",
        merke: "Darin stecken Verweise auf weitere Adressen, die der Browser <strong>einzeln nachholt</strong> – deshalb sind es für eine Seite selten unter fünfzig Nachrichten." }
    ]
  };

  var wurzel = document.querySelector(".hg");
  if (!wurzel) return;

  /* --- Die vier Eigenschaften: aufklappen ---------------------------------- */
  /* Nachtrag hinter einem Klick. Ohne showModal() waere <dialog> nur ein Kasten
     im Fluss - erst damit kommen Hintergrund, Esc und Fokusfang vom Browser. */
  wurzel.querySelectorAll("[data-hg-pop]").forEach(function (knopf) {
    var dialog = document.getElementById("hg-pop-" + knopf.getAttribute("data-hg-pop"));
    if (!dialog || typeof dialog.showModal !== "function") { knopf.hidden = true; return; }
    knopf.addEventListener("click", function () { dialog.showModal(); });
    var zu = dialog.querySelector("[data-hg-pop-zu]");
    if (zu) { zu.addEventListener("click", function () { dialog.close(); }); }
    /* Klick auf den Hintergrund schliesst: Der Klick landet auf dem <dialog>
       selbst, nicht auf seinem Inhalt. */
    dialog.addEventListener("click", function (ev) {
      if (ev.target === dialog) { dialog.close(); }
    });
    dialog.addEventListener("close", function () { knopf.focus(); });
  });

  wurzel.querySelectorAll(".hg__mehr").forEach(function (knopf) {
    var detail = knopf.nextElementSibling;
    function schalte(offen) {
      detail.classList.toggle("is-offen", offen);
      knopf.setAttribute("aria-expanded", offen ? "true" : "false");
      knopf.textContent = offen ? "Weniger" : "Was daraus folgt";
    }
    knopf.addEventListener("click", function () {
      schalte(!detail.classList.contains("is-offen"));
      merken();
    });
    knopf._hg = schalte;
  });

  /* --- Die Nachricht: Bestandteile anklickbar ------------------------------ */
  var detail = wurzel.querySelector("[data-hg-detail]");
  var druck = wurzel.querySelector(".hg__druck");
  var alle = [];

  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  Object.keys(NACHRICHTEN).forEach(function (schluessel) {
    var ziel = wurzel.querySelector('[data-hg-msg="' + schluessel + '"]');
    NACHRICHTEN[schluessel].forEach(function (teil) {
      var knopf = document.createElement("button");
      knopf.type = "button";
      knopf.className = "hg__teil hg__teil--" + (teil.art === "body" ? "zettel" : "umschlag") +
        (teil.art === "leer" || teil.zeilen[0].charAt(0) === "(" ? " hg__teil--leer" : "");
      knopf.setAttribute("aria-label", teil.titel + " – erklären");
      knopf.innerHTML = teil.zeilen.map(function (z) {
        if (z === "") return "&nbsp;";
        var t = esc(z);
        if (teil.art === "header") t = t.replace(/^([A-Za-z-]+)(:)/, '<span class="hg__marke">$1</span>$2');
        if (teil.art === "start") t = t.replace(/^(GET|POST)\b/, '<span class="hg__marke">$1</span>')
                                       .replace(/\b(200)\b/, '<span class="hg__marke">$1</span>');
        return t;
      }).join("\n");
      knopf.addEventListener("click", function () { zeige(teil, knopf); merken(); });
      /* Kennung fuer die Adresse: `anfrage-header` statt einer Nummer. */
      knopf.dataset.hgTeil = schluessel + "-" + teil.art;
      knopf._hgTeil = teil;
      alle.push(knopf);
      ziel.appendChild(knopf);
    });
  });

  function zeige(teil, knopf) {
    alle.forEach(function (k) { k.classList.toggle("is-aktiv", k === knopf); });
    detail.innerHTML = "<h3>" + teil.titel + "</h3><p>" + teil.text + "</p>" +
      (teil.merke ? '<p class="hg__merke">' + teil.merke + "</p>" : "");
  }

  /* --- Zustand in der Adresse ---------------------------------------------
     ZWEI DINGE STEHEN HIER ZUR WAHL: welcher Bestandteil der Nachricht erklaert
     wird (`teil`) und welche „Was daraus folgt"-Abschnitte offen sind (die reihen
     sich in den gemeinsamen Schluessel `open` des Themes ein). Ein Kapitel des
     Regiebuchs kann damit auf „die Leerzeile" zeigen statt auf die Seite.

     Angemeldet wird bei `skr.state` des Skriptoriums - es gibt nur EIN
     Fragment je Seite, und wer allein hineinschreibt, loescht den Zustand der
     uebrigen Bausteine. Erst bei DOMContentLoaded, weil das Theme-Skript `defer`
     traegt und damit nach diesem hier laeuft.

     BEWUSST NICHT IN DER ADRESSE: die beiden `<dialog>`-Nachtraege. Ein modaler
     Dialog, der sich beim Laden von selbst oeffnet, faengt den Fokus, bevor
     jemand weiss, worum es geht. */
  function merken() { if (window.skr && window.skr.state) { window.skr.state.update(); } }

  function anmelden() {
    if (!(window.skr && window.skr.state)) { return; }

    window.skr.state.register({
      key: "teil",
      read: function () {
        var a = alle.filter(function (k) { return k.classList.contains("is-aktiv"); })[0];
        return a ? a.dataset.hgTeil : "";
      },
      apply: function (wert) {
        var k = alle.filter(function (x) { return x.dataset.hgTeil === wert; })[0];
        if (k) { zeige(k._hgTeil, k); }
      }
    });

    wurzel.querySelectorAll(".hg__mehr").forEach(function (knopf) {
      var detail = knopf.nextElementSibling;
      window.skr.state.openable({
        id: "folgt-" + knopf.getAttribute("data-hg-mehr"),
        isOpen: function () { return detail.classList.contains("is-offen"); },
        set: function (auf) { knopf._hg(auf); }
      });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", anmelden);
  } else {
    anmelden();
  }

  /* Fuer den Ausdruck: alle Erklaerungen als Liste. Am Bildschirm ausgeblendet. */
  var dl = document.createElement("dl");
  ["anfrage", "antwort"].forEach(function (k) {
    NACHRICHTEN[k].forEach(function (t) {
      var dt = document.createElement("dt");
      dt.textContent = t.titel;
      var dd = document.createElement("dd");
      dd.innerHTML = t.text + (t.merke ? " " + t.merke : "");
      dl.appendChild(dt); dl.appendChild(dd);
    });
  });
  var h = document.createElement("h3");
  h.textContent = "Die Bestandteile im Einzelnen";
  druck.appendChild(h);
  druck.appendChild(dl);
})();
