/* Skript der Seite 11-code-first-vs-contract-first/gegenueberstellung.md – über `scripts:` im Front Matter geladen. */
(function () {
  "use strict";

  var FRAGEN = [
    { id: "f1", text: "Greift ein anderes Team auf diese API zu – und sei es nur die Qualitätssicherung?", gewicht: 3 },
    { id: "f2", text: "Steht ein API Gateway davor, das eigene Aufgaben übernimmt (Auth, CORS, Drosselung)?", gewicht: 2 },
    { id: "f3", text: "Soll die API mehr als eine Implementierung überleben oder von mehreren bedient werden?", gewicht: 2 },
    { id: "f4", text: "Wäre ein unbemerkter Bruch der Schnittstelle für jemanden teuer?", gewicht: 3 },
    { id: "f5", text: "Wird die API außerhalb Eurer Sprache/Eures Frameworks genutzt?", gewicht: 1 },
    { id: "f6", text: "Ist das hier ein Wegwerf-Prototyp mit festem Enddatum?", gewicht: -3 }
  ];

  var wurzel = document.querySelector(".cf");
  if (!wurzel) return;

  var quiz = wurzel.querySelector("[data-cf-quiz]");
  var ergebnis = wurzel.querySelector("[data-cf-ergebnis]");
  var antworten = {};

  FRAGEN.forEach(function (f) {
    var zeile = document.createElement("div");
    zeile.className = "cf__frage";
    var text = document.createElement("p");
    text.textContent = f.text;
    var wahl = document.createElement("div");
    wahl.className = "cf__wahl";

    [["ja", true], ["nein", false]].forEach(function (paar) {
      var knopf = document.createElement("button");
      knopf.type = "button";
      knopf.className = "cf__opt";
      knopf.textContent = paar[0];
      knopf.setAttribute("aria-pressed", "false");
      knopf.setAttribute("aria-label", f.text + " – " + paar[0]);
      knopf.addEventListener("click", function () {
        antworten[f.id] = paar[1];
        Array.prototype.forEach.call(wahl.children, function (k) {
          k.setAttribute("aria-pressed", k === knopf ? "true" : "false");
        });
        werte();
      });
      wahl.appendChild(knopf);
    });

    zeile.appendChild(text);
    zeile.appendChild(wahl);
    quiz.appendChild(zeile);
  });

  function werte() {
    var beantwortet = FRAGEN.filter(function (f) { return f.id in antworten; });
    if (beantwortet.length < FRAGEN.length) {
      ergebnis.innerHTML = '<p class="cf__hint">Noch ' +
        (FRAGEN.length - beantwortet.length) + " von " + FRAGEN.length +
        " Fragen offen.</p>";
      return;
    }

    var punkte = 0;
    FRAGEN.forEach(function (f) { if (antworten[f.id]) punkte += f.gewicht; });

    var titel, text, zusatz;
    if (punkte >= 5) {
      titel = "Contract First – ohne Wenn und Aber";
      text = "Deine Schnittstelle ist ein Vertrag mit anderen. Sie zuerst zu beschreiben ist hier keine Stilfrage, sondern der Unterschied zwischen einer Änderung und einem Vorfall.";
      zusatz = "Nächster Schritt: die Beschreibung dorthin legen, wo sie ein eigenes Release bekommen kann – nicht in den Service, der sie zufällig bedient.";
    } else if (punkte >= 1) {
      titel = "Contract First, mit pragmatischem Einstieg";
      text = "Die Argumente wiegen schwer genug, dass die Beschreibung führen sollte. Wenn Euch der Einstieg schwerfällt, beginnt mit Code und legt einen Zeitpunkt fest, ab dem die Beschreibung die Führung übernimmt.";
      zusatz = "Wichtig ist, dass dieser Zeitpunkt <strong>festgelegt</strong> wird. Prototypen, die niemand abgelöst hat, sind die häufigste Ursache für Code First im Produktivbetrieb.";
    } else {
      titel = "Code First ist hier vertretbar";
      text = "Die Schnittstelle bleibt im Team, und ein Bruch trifft niemanden, der nicht mit im Raum sitzt. Dann darf die Beschreibung Nebenprodukt sein.";
      zusatz = "Beobachte die erste Frage weiter: Sobald ein anderes Team zugreift – auch die Qualitätssicherung –, ändert sich die Antwort.";
    }

    ergebnis.innerHTML = "<h3>" + titel + "</h3><p>" + text + "</p><p>" + zusatz + "</p>";
  }

  werte();
})();
