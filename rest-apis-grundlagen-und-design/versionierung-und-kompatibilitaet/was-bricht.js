/* Skript der Seite 08-versionierung-und-kompatibilitaet/was-bricht.md – über `scripts:` im Front Matter geladen. */
(function () {
  "use strict";

  var FAELLE = [
    {
      was: "Das Feld <code>telefon</code> kommt neu in der Kundenantwort dazu.",
      art: "ok", urteil: "Bricht nicht – wenn es eine Zusicherung gibt",
      warum: "Wer das Feld nicht kennt, liest es nicht. Das gilt aber nur, solange die Aufrufer unbekannte Felder wirklich ignorieren. Ein streng validierender Client (<code>additionalProperties: false</code>) fliegt genau hier auf die Nase – und das sind oft die erzeugten.",
      weg: "Schreib in die Dokumentation: „Felder, die Du nicht kennst, ignoriere.“ Ein Satz, der über Jahre Ärger spart."
    },
    {
      was: "Das Feld <code>fax</code> wird aus der Kundenantwort entfernt.",
      art: "bruch", urteil: "Bricht",
      warum: "Jeder Aufrufer, der es liest, bekommt ab sofort nichts mehr – in typisierten Clients meist gleich eine Ausnahme beim Deserialisieren.",
      weg: "In drei Schritten: als veraltet kennzeichnen (<code>Deprecation</code>-Kopf, OpenAPI <code>deprecated</code>), messen, wer es noch liest, und erst entfernen, wenn niemand mehr zugreift."
    },
    {
      was: "<code>name</code> wird in <code>fullName</code> umbenannt.",
      art: "bruch", urteil: "Bricht – das ist Fall 2 und Fall 1 in einem",
      warum: "Umbenennen ist kein eigener Vorgang: Es ist ein Feld weggenommen und ein neues hinzugefügt. Der Bruch steckt in der ersten Hälfte.",
      weg: "Eine Zeit lang <strong>beide</strong> Felder ausliefern und beim Schreiben beide annehmen, <code>name</code> als veraltet kennzeichnen. Die Frage ist nicht, ob es geht, sondern wie lange man beides betreibt."
    },
    {
      was: "<code>birthdate</code> war beim Anlegen optional und wird zur Pflicht.",
      art: "bruch", urteil: "Bricht",
      warum: "Ein Aufrufer, der es bisher weggelassen hat, bekommt ab sofort <code>400</code>. <strong>Im Request darf man lockern, nie verschärfen</strong> – das ist die Spiegelregel zur Antwort.",
      weg: "Entweder einen fachlich vertretbaren Standardwert setzen, oder die Pflicht nur in einer neuen Version verlangen und die alte weiter betreiben."
    },
    {
      was: "<code>kundennummer</code> war eine Zahl und wird zu einer Zeichenkette.",
      art: "bruch", urteil: "Bricht",
      warum: "Ein Typwechsel ist immer ein Bruch. Erzeugte Clients werfen beim Deserialisieren; handgeschriebene rechnen irgendwo mit dem Wert und bekommen etwas Absurdes heraus.",
      weg: "Ein <strong>neues Feld daneben</strong> (<code>kundennummerText</code>), das alte unverändert weiterliefern – und dann denselben Dreischritt wie beim Entfernen."
    },
    {
      was: "Der Status kann neben <code>aktiv</code>, <code>deaktiviert</code> und <code>gesperrt</code> künftig auch <code>in_pruefung</code> sein.",
      art: "praxis", urteil: "Formal verträglich – und trotzdem einer der gefährlichsten Fälle",
      warum: "Es wird nichts weggenommen und nichts umbenannt. Aber jeder Aufrufer, der daraus ein Aufzählungsobjekt gemacht hat, bekommt beim Einlesen eine Ausnahme – und jedes <code>switch</code> ohne <code>default</code> läuft ins Leere. <strong>Die Aufrufer haben die Werteliste für vollständig gehalten, weil nirgends stand, dass sie wächst.</strong>",
      weg: "Von Anfang an zusichern: „Diese Liste kann wachsen. Behandle unbekannte Werte wie <em>X</em>.“ Danach ist derselbe Schritt harmlos."
    },
    {
      was: "<code>GET /customers</code> liefert künftig nach Nachname sortiert statt nach Anlagedatum.",
      art: "praxis", urteil: "Formal verträglich – bricht still",
      warum: "Dieselben Felder, dieselben Typen, derselbe Statuscode. Nur holt sich jemand mit <code>?limit=10</code> seit einem Jahr „die zehn neuesten Kunden“ – und bekommt jetzt zehn Kunden, deren Nachname mit A beginnt. <strong>Es gibt keinen Fehler, nur falsche Daten.</strong>",
      weg: "Die Sortierung gehört in den Vertrag – entweder als Zusicherung oder ausdrücklich als <em>nicht</em> zugesichert. Schweigen ist hier ein Versprechen."
    },
    {
      was: "<code>GET /customers</code> liefert künftig nur noch die ersten 100 Einträge.",
      art: "bruch", urteil: "Bricht – und zwar unsichtbar",
      warum: "Wer bisher alles bekam, bekommt jetzt stillschweigend weniger und hält es für alles. Das ist schlimmer als ein Fehler, weil es wie Erfolg aussieht. Fachlich ist die Änderung trotzdem richtig – ohne Obergrenze fällt irgendwann der Service um.",
      weg: "Paginierung einführen, aber die Grenze <strong>ankündigen und beziffern</strong>: Antwort mit <code>next</code>-Verweis und Gesamtzahl, Übergangsfrist, und erst danach die Obergrenze schärfen."
    },
    {
      was: "Beim Anlegen eines doppelten Kunden kommt statt <code>400</code> künftig <code>409</code>.",
      art: "bruch", urteil: "Bricht, wenn jemand auf den Code prüft",
      warum: "Wer <code>=== 400</code> abfragt, landet ab sofort im allgemeinen Fehlerzweig und zeigt dem Nutzer etwas Falsches. Wer nur <code>>= 400</code> prüft, merkt nichts – <strong>der Bruch hängt daran, wie sorgfältig der Aufrufer gebaut ist</strong>.",
      weg: "Die Fehlerursache <em>im Body</em> transportieren (Problem Details, Feld <code>type</code>) statt im Statuscode. Dann darf der Code sich ändern, ohne dass jemand nachzieht."
    },
    {
      was: "Es gibt eine neue Operation <code>GET /customers/{id}/orders</code>.",
      art: "ok", urteil: "Bricht nicht",
      warum: "Eine neue Adresse kennt bisher niemand, also ruft sie auch niemand auf. <strong>Hinzufügen an einer neuen Stelle ist der einzige risikofreie Fall in dieser Liste.</strong>",
      weg: "Nichts zu tun – außer die Frage, ob die Operation später wieder wegkann. Was einmal veröffentlicht ist, muss betrieben werden."
    }
  ];

  var liste = document.querySelector("[data-wb-liste]");
  if (!liste) return;

  /* EINE LESBARE ID JE KARTE - sie landet in der Adresse. `#/?open=feld-umbenennen`
     ist ein brauchbares Lesezeichen, `#/?open=karte-3` nicht, und eine Nummer
     ueberlebt das Umsortieren der Faelle ohnehin nicht. */
  function kennung(text) {
    return "wb-" + text.replace(/<[^>]*>/g, "").toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  }

  FAELLE.forEach(function (f, i) {
    var li = document.createElement("li");
    li.className = "wb__karte";
    li.id = kennung(f.was);
    li.dataset.art = f.art;
    li.innerHTML =
      '<button type="button" class="wb__kopf" aria-expanded="false">' +
        '<span class="wb__nr">' + (i + 1) + '</span>' +
        '<span class="wb__was">' + f.was + '</span>' +
        '<span class="wb__pfeil" aria-hidden="true">▸</span>' +
      '</button>' +
      '<div class="wb__auf">' +
        '<p class="wb__urteil">' + f.urteil + '</p>' +
        '<p class="wb__warum">' + f.warum + '</p>' +
        '<p class="wb__weg"><strong>Verträglicher Weg</strong>' + f.weg + '</p>' +
      '</div>';
    liste.appendChild(li);
  });

  function schalte(karte, auf) {
    karte.classList.toggle("ist-offen", auf);
    /* Die Farbe kommt erst mit dem Aufdecken - sonst verrät der Rand das Urteil. */
    karte.classList.toggle("ist-" + karte.dataset.art, auf);
    karte.querySelector(".wb__kopf").setAttribute("aria-expanded", auf ? "true" : "false");
  }

  liste.addEventListener("click", function (e) {
    var kopf = e.target.closest(".wb__kopf");
    if (!kopf) return;
    var karte = kopf.parentNode;
    schalte(karte, !karte.classList.contains("ist-offen"));
    merken();
  });

  document.querySelector("[data-wb-alle]").addEventListener("click", function () {
    liste.querySelectorAll(".wb__karte").forEach(function (k) { schalte(k, true); });
    merken();
  });
  document.querySelector("[data-wb-zu]").addEventListener("click", function () {
    liste.querySelectorAll(".wb__karte").forEach(function (k) { schalte(k, false); });
    merken();
  });

  /* --- Zustand in der Adresse ---------------------------------------------
     AUFGEDECKT IST EIN ZUSTAND: Wer im Kurs drei Faelle aufgeschlagen hat und neu
     laedt, will sie wiederfinden - und ein Verweis aus dem Regiebuch darf genau
     auf einen Fall zeigen.

     Die Karten reihen sich in den Schluessel `open` des Themes ein (ab 2.46.0),
     zusammen mit Reitern, Folds und Reveals derselben Seite. Selbst ins Fragment
     zu schreiben waere falsch: Es gibt nur eines, und wer es allein beansprucht,
     loescht den Zustand der uebrigen Bausteine. Die Anmeldung wartet auf
     DOMContentLoaded, weil das Theme-Skript `defer` traegt. */
  function merken() { if (window.skr && window.skr.state) { window.skr.state.update(); } }

  function anmelden() {
    if (!(window.skr && window.skr.state)) { return; }
    liste.querySelectorAll(".wb__karte").forEach(function (karte) {
      window.skr.state.openable({
        id: karte.id,
        isOpen: function () { return karte.classList.contains("ist-offen"); },
        set: function (auf) { schalte(karte, auf); }
      });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", anmelden);
  } else {
    anmelden();
  }
})();
