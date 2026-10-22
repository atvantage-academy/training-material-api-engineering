/* Skript der Seite 12-hypermedia-und-hal/reifegrad-modell.md – über `scripts:` im Front Matter geladen. */
(function () {
  "use strict";

  var STUFEN = {
    "0": {
      titel: "Stufe 0 – HTTP als Briefkasten",
      text: "Eine einzige Adresse, alles per <code>POST</code>. Was geschehen soll, steht im Body. HTTP überträgt nur – von seiner Bedeutung wird nichts genutzt.",
      anfrage: "POST /api/execute\nContent-Type: application/json\n\n{\n  \"action\": \"getCustomer\",\n  \"id\": 5\n}",
      antwort: "200 OK\n\n{\n  \"result\": { \"id\": 5, \"name\": \"Maier\" }\n}",
      merke: "Kommt häufiger vor, als man denkt – auch bei Systemen, die sich „REST-API“ nennen. <strong>Erkennungszeichen:</strong> eine Adresse wie <code>/api/execute</code>, ein Feld <code>action</code> im Body, und Fehler kommen als <code>200 OK</code> mit einem Fehlerfeld."
    },
    "1": {
      titel: "Stufe 1 – Ressourcen",
      text: "Verschiedene Dinge bekommen verschiedene Adressen. Damit ist zumindest ansprechbar, worum es geht. Die Methode bleibt aber <code>POST</code>, und was getan werden soll, steht weiter im Body.",
      anfrage: "POST /customers/5\nContent-Type: application/json\n\n{\n  \"action\": \"read\"\n}",
      antwort: "200 OK\n\n{\n  \"result\": { \"id\": 5, \"name\": \"Maier\" }\n}",
      merke: "Ein echter Fortschritt: Die Adresse sagt jetzt, <em>worum</em> es geht. Aber weil alles <code>POST</code> ist, kann <strong>keine Zwischenstation etwas damit anfangen</strong> – kein Cache, kein Gateway, kein Wiederholungsversuch."
    },
    "2": {
      titel: "Stufe 2 – HTTP-Verben und Statuscodes",
      text: "Die Methode sagt, <em>was</em> geschieht, die Adresse, <em>womit</em>. Der Statuscode sagt, wie es ausging. Jetzt arbeitet die Infrastruktur mit: <code>GET</code> ist cachebar, <code>PUT</code> und <code>DELETE</code> sind wiederholbar, <code>404</code> ist ein Fehler für jeden Beteiligten.",
      anfrage: "GET /customers/5\nAccept: application/json",
      antwort: "200 OK\nContent-Type: application/json\n\n{\n  \"id\": 5,\n  \"name\": \"Maier\",\n  \"status\": \"aktiv\"\n}",
      merke: "<strong>Hier steht praktisch alles, was „REST-API“ heißt</strong> – und alles, was in diesem Kurs entworfen wurde. Das ist kein Zwischenstand, sondern für die meisten APIs der richtige Platz."
    },
    "3": {
      titel: "Stufe 3 – Hypermedia",
      text: "Die Antwort enthält, was jetzt möglich ist. Ein <strong>aktiver</strong> Kunde bekommt den Verweis zum Deaktivieren, ein <strong>deaktivierter</strong> den zum Aktivieren. Der Client muss die Regel nicht kennen – er zeigt einen Knopf, wenn der Verweis da ist.",
      anfrage: "GET /customers/5\nAccept: application/hal+json",
      antwort: "200 OK\nContent-Type: application/hal+json\n\n{\n  \"id\": 5,\n  \"name\": \"Maier\",\n  \"status\": \"aktiv\",\n  \"_links\": {\n    \"self\":       { \"href\": \"/customers/5\" },\n    \"orders\":     { \"href\": \"/customers/5/orders\" },\n    \"deactivate\": { \"href\": \"/customers/5/flags/deactivation\" }\n  }\n}",
      merke: "<strong>Die Geschäftsregel steht nur noch an einer Stelle.</strong> Ändert sich, wann ein Kunde deaktiviert werden darf, muss kein einziger Client angefasst werden – der Verweis ist einfach da oder nicht."
    }
  };

  var wurzel = document.querySelector(".rm");
  if (!wurzel) return;
  var panel = wurzel.querySelector("[data-rm-panel]");
  var stufen = Array.prototype.slice.call(wurzel.querySelectorAll("[data-rm]"));

  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  function zeige(knopf) {
    var d = STUFEN[knopf.getAttribute("data-rm")];
    stufen.forEach(function (k) { k.classList.toggle("is-aktiv", k === knopf); });
    panel.innerHTML =
      "<h3>" + d.titel + "</h3>" +
      "<p>" + d.text + "</p>" +
      '<p class="rm__label">Anfrage</p><pre class="rm__msg">' + esc(d.anfrage) + "</pre>" +
      '<p class="rm__label">Antwort</p><pre class="rm__msg">' + esc(d.antwort) + "</pre>" +
      '<p class="rm__merke">' + d.merke + "</p>";
  }

  stufen.forEach(function (knopf) {
    knopf.addEventListener("click", function () { zeige(knopf); merken(); });
  });

  /* --- Zustand in der Adresse ---------------------------------------------
     DIE GEWAEHLTE STUFE GEHOERT IN DIE ADRESSE. Ein Kapitel des Regiebuchs
     verweist auf „Stufe 2", ein Teilnehmer scannt den QR-Code, jemand legt ein
     Lesezeichen an - ohne den Zustand landen alle drei auf dem leeren Panel.

     GESCHRIEBEN WIRD NICHT SELBST, sondern ueber `skr.state` des Skriptoriums
     (ab 2.46.0): Es gibt nur EIN Fragment je Seite, und wer allein hineinschreibt,
     loescht den Zustand der uebrigen Bausteine. Die Anmeldung wartet auf
     DOMContentLoaded, weil das Theme-Skript `defer` traegt und damit erst nach
     diesem Inline-Skript laeuft. */
  function merken() { if (window.skr && window.skr.state) { window.skr.state.update(); } }

  function anmelden() {
    if (!(window.skr && window.skr.state)) { return; }
    window.skr.state.register({
      key: "stufe",
      read: function () {
        var a = wurzel.querySelector("[data-rm].is-aktiv");
        return a ? a.getAttribute("data-rm") : "";
      },
      apply: function (wert) {
        var k = wurzel.querySelector('[data-rm="' + wert.replace(/[^0-9]/g, "") + '"]');
        if (k) { zeige(k); }
      }
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", anmelden);
  } else {
    anmelden();
  }
})();
