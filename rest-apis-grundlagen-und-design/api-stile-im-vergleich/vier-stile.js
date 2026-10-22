/* Skript der Seite 10-api-stile-im-vergleich/vier-stile.md – über `scripts:` im Front Matter geladen. */
(function () {
  "use strict";

  function Z() { return Array.prototype.join.call(arguments, "\n"); }

  var SOAP_HUELLE = '<soap:Envelope\n    xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">';

  /* ------------------------------------------------------------------ Daten
     Je Stil und Aufgabe die rohe Nachricht: Anfrage, Erfolgsantwort und der
     Fehlerfall dazu - in derselben Form, in der sie ueber die Leitung geht. */

  var DATEN = {

    /* =============================================================== SOAP */
    soap: {
      alles: {
        anfrage: Z(
          "POST /CustomerService HTTP/1.1",
          "Host: api.shop.example",
          "Content-Type: text/xml; charset=utf-8",
          'SOAPAction: "getCustomer"',
          "Content-Length: 231",
          "",
          SOAP_HUELLE,
          "  <soap:Body>",
          '    <getCustomerRequest xmlns="urn:shop:kunden:v1">',
          "      <id>4711</id>",
          "    </getCustomerRequest>",
          "  </soap:Body>",
          "</soap:Envelope>"),
        antwort: Z(
          "HTTP/1.1 200 OK",
          "Content-Type: text/xml; charset=utf-8",
          "",
          SOAP_HUELLE,
          "  <soap:Body>",
          '    <getCustomerResponse xmlns="urn:shop:kunden:v1">',
          "      <id>4711</id>",
          "      <name>Meier</name>",
          "      <geburtsdatum>1984-03-02</geburtsdatum>",
          "      <anschriften>",
          "        <anschrift><strasse>Hauptstr. 1</strasse><ort>Köln</ort></anschrift>",
          "      </anschriften>",
          "      <zahlungsarten>",
          "        <zahlungsart><art>KREDITKARTE</art><letzte4>4242</letzte4></zahlungsart>",
          "      </zahlungsarten>",
          "    </getCustomerResponse>",
          "  </soap:Body>",
          "</soap:Envelope>"),
        fehlertitel: "Antwort · den Kunden gibt es nicht",
        fehler: Z(
          "HTTP/1.1 200 OK",
          "Content-Type: text/xml; charset=utf-8",
          "",
          SOAP_HUELLE,
          "  <soap:Body>",
          '    <getCustomerResponse xmlns="urn:shop:kunden:v1">',
          "      <fehler>",
          "        <code>KUNDE_UNBEKANNT</code>",
          "        <text>Es gibt keinen Kunden mit der Kennung 4711.</text>",
          "      </fehler>",
          "    </getCustomerResponse>",
          "  </soap:Body>",
          "</soap:Envelope>"),
        hinweis: "Die Adresse ist für alle vier Aufgaben dieselbe; was gemeint ist, steht im Umschlag und im Kopf <code>SOAPAction</code>. <strong>Und der unbekannte Kunde ist eine <code>200</code></strong> – ein fachliches Ergebnis wird als Feld in der normalen Antwort modelliert, nicht als Protokollfehler. Ein <code>soap:Fault</code> wäre etwas anderes: Der kommt laut SOAP 1.1 mit <code>500</code> und meint, dass die <em>Nachricht</em> nicht verarbeitbar war."
      },
      ohne: {
        anfrage: Z(
          "POST /CustomerService HTTP/1.1",
          "Host: api.shop.example",
          "Content-Type: text/xml; charset=utf-8",
          'SOAPAction: "getCustomerBasic"',
          "",
          SOAP_HUELLE,
          "  <soap:Body>",
          '    <getCustomerBasicRequest xmlns="urn:shop:kunden:v1">',
          "      <id>4711</id>",
          "    </getCustomerBasicRequest>",
          "  </soap:Body>",
          "</soap:Envelope>"),
        antwort: Z(
          "HTTP/1.1 200 OK",
          "Content-Type: text/xml; charset=utf-8",
          "",
          SOAP_HUELLE,
          "  <soap:Body>",
          '    <getCustomerBasicResponse xmlns="urn:shop:kunden:v1">',
          "      <id>4711</id>",
          "      <name>Meier</name>",
          "      <geburtsdatum>1984-03-02</geburtsdatum>",
          "    </getCustomerBasicResponse>",
          "  </soap:Body>",
          "</soap:Envelope>"),
        fehlertitel: "Antwort · den Kunden gibt es nicht",
        fehler: Z(
          "HTTP/1.1 200 OK",
          "Content-Type: text/xml; charset=utf-8",
          "",
          SOAP_HUELLE,
          "  <soap:Body>",
          '    <getCustomerBasicResponse xmlns="urn:shop:kunden:v1">',
          "      <fehler>",
          "        <code>KUNDE_UNBEKANNT</code>",
          "        <text>Es gibt keinen Kunden mit der Kennung 4711.</text>",
          "      </fehler>",
          "    </getCustomerBasicResponse>",
          "  </soap:Body>",
          "</soap:Envelope>"),
        hinweis: "<strong>Eine Feldauswahl gibt es nicht.</strong> Wer weniger will, braucht eine <em>zweite Operation</em> im WSDL – mit eigenem Typ, eigenem Antwortelement und eigenem Fehlerfeld. Und bis jeder Client neu erzeugt ist, kennt sie niemand. <strong>Zwei Operationen für dieselbe Sache, und ab jetzt für immer beide pflegen.</strong>"
      },
      anlegen: {
        anfrage: Z(
          "POST /CustomerService HTTP/1.1",
          "Host: api.shop.example",
          "Content-Type: text/xml; charset=utf-8",
          'SOAPAction: "createCustomer"',
          "",
          SOAP_HUELLE,
          "  <soap:Body>",
          '    <createCustomerRequest xmlns="urn:shop:kunden:v1">',
          "      <name>Meier</name>",
          "      <geburtsdatum>1984-03-02</geburtsdatum>",
          "    </createCustomerRequest>",
          "  </soap:Body>",
          "</soap:Envelope>"),
        antwort: Z(
          "HTTP/1.1 200 OK",
          "Content-Type: text/xml; charset=utf-8",
          "",
          SOAP_HUELLE,
          "  <soap:Body>",
          '    <createCustomerResponse xmlns="urn:shop:kunden:v1">',
          "      <id>4711</id>",
          "    </createCustomerResponse>",
          "  </soap:Body>",
          "</soap:Envelope>"),
        fehlertitel: "Antwort · die Daten sind nicht gültig",
        fehler: Z(
          "HTTP/1.1 200 OK",
          "Content-Type: text/xml; charset=utf-8",
          "",
          SOAP_HUELLE,
          "  <soap:Body>",
          '    <createCustomerResponse xmlns="urn:shop:kunden:v1">',
          "      <fehler>",
          "        <code>VALIDIERUNG</code>",
          "        <text>Die Angaben sind unvollständig.</text>",
          "        <feld name=\"geburtsdatum\">Pflichtangabe fehlt</feld>",
          "        <feld name=\"name\">darf nicht leer sein</feld>",
          "      </fehler>",
          "    </createCustomerResponse>",
          "  </soap:Body>",
          "</soap:Envelope>"),
        hinweis: "Die neue Kennung steht im Antwort-Umschlag, nicht in einem <code>Location</code>-Kopf – <strong>es gibt keine Adresse, auf die sie zeigen könnte</strong>.<br><br><strong>Auch die Validierung ist ein <code>200</code></strong>: Die Feldfehler stehen strukturiert in der normalen Antwort. Ein <code>soap:Fault</code> wäre etwas anderes und käme laut SOAP 1.1 mit <code>500</code> – der meint aber, dass die <em>Nachricht</em> nicht verarbeitbar war, nicht dass ihr <em>Inhalt</em> fachlich nicht durchgeht. <strong>In allen vier Aufgaben steht im Kopf also dasselbe: <code>200 OK</code>.</strong>"
      },
      loeschen: {
        anfrage: Z(
          "POST /CustomerService HTTP/1.1",
          "Host: api.shop.example",
          "Content-Type: text/xml; charset=utf-8",
          'SOAPAction: "deleteCustomer"',
          "",
          SOAP_HUELLE,
          "  <soap:Body>",
          '    <deleteCustomerRequest xmlns="urn:shop:kunden:v1">',
          "      <id>4711</id>",
          "    </deleteCustomerRequest>",
          "  </soap:Body>",
          "</soap:Envelope>"),
        antwort: Z(
          "HTTP/1.1 200 OK",
          "Content-Type: text/xml; charset=utf-8",
          "",
          SOAP_HUELLE,
          "  <soap:Body>",
          '    <deleteCustomerResponse xmlns="urn:shop:kunden:v1"/>',
          "  </soap:Body>",
          "</soap:Envelope>"),
        fehlertitel: "Antwort · den Kunden gibt es nicht",
        fehler: Z(
          "HTTP/1.1 200 OK",
          "Content-Type: text/xml; charset=utf-8",
          "",
          SOAP_HUELLE,
          "  <soap:Body>",
          '    <deleteCustomerResponse xmlns="urn:shop:kunden:v1">',
          "      <fehler>",
          "        <code>KUNDE_UNBEKANNT</code>",
          "        <text>Es gibt keinen Kunden mit der Kennung 4711.</text>",
          "      </fehler>",
          "    </deleteCustomerResponse>",
          "  </soap:Body>",
          "</soap:Envelope>"),
        hinweis: "Löschen ist hier ein <code>POST</code> wie alles andere. <strong>Ob der Aufruf wiederholbar ist, sieht man der Nachricht nicht an</strong> – das steht allenfalls in der Dokumentation. Bei <code>DELETE</code> wäre es ein Merkmal der Methode."
      }
    },

    /* =============================================================== REST */
    rest: {
      alles: {
        anfrage: Z(
          "GET /customers/4711 HTTP/1.1",
          "Host: api.shop.example",
          "Accept: application/json"),
        antwort: Z(
          "HTTP/1.1 200 OK",
          "Content-Type: application/json",
          'ETag: "a1b2c3"',
          "Cache-Control: max-age=60",
          "",
          "{",
          '  "id": "4711",',
          '  "name": "Meier",',
          '  "geburtsdatum": "1984-03-02",',
          '  "anschriften": [',
          '    { "strasse": "Hauptstr. 1", "ort": "Köln" }',
          "  ],",
          '  "zahlungsarten": [',
          '    { "art": "KREDITKARTE", "letzte4": "4242" }',
          "  ]",
          "}"),
        fehlertitel: "Antwort · den Kunden gibt es nicht",
        fehler: Z(
          "HTTP/1.1 404 Not Found",
          "Content-Type: application/problem+json",
          "",
          "{",
          '  "type": "https://api.shop.example/probleme/kunde-unbekannt",',
          '  "title": "Kunde nicht gefunden",',
          '  "status": 404,',
          '  "detail": "Es gibt keinen Kunden mit der Kennung 4711.",',
          '  "instance": "/customers/4711"',
          "}"),
        hinweis: "Ein <code>GET</code> auf eine eigene Adresse: im Browser aufrufbar, für jede Zwischenstation cachebar (<code>ETag</code>, <code>Cache-Control</code>), und der <strong>Statuscode allein sagt schon, was los ist</strong>. Das Fehlerformat ist standardisiert – <strong>RFC 9457</strong>, Medientyp <code>application/problem+json</code>."
      },
      ohne: {
        anfrage: Z(
          "GET /customers/4711?fields=id,name,geburtsdatum HTTP/1.1",
          "Host: api.shop.example",
          "Accept: application/json"),
        antwort: Z(
          "HTTP/1.1 200 OK",
          "Content-Type: application/json",
          "",
          "{",
          '  "id": "4711",',
          '  "name": "Meier",',
          '  "geburtsdatum": "1984-03-02"',
          "}"),
        fehlertitel: "Antwort · das Feld kennt der Server nicht",
        fehler: Z(
          "HTTP/1.1 400 Bad Request",
          "Content-Type: application/problem+json",
          "",
          "{",
          '  "type": "https://api.shop.example/probleme/unbekanntes-feld",',
          '  "title": "Unbekanntes Feld in fields",',
          '  "status": 400,',
          '  "detail": "telefon ist kein Feld von Customer.",',
          '  "erlaubt": [ "id", "name", "geburtsdatum", "anschriften", "zahlungsarten" ]',
          "}"),
        hinweis: "<strong>Hier hat REST keine Antwort von der Stange.</strong> <code>?fields=</code> ist verbreitet, aber nicht standardisiert – jede API erfindet es neu, und jede erfindet auch den Fehlerfall dazu neu.<br><br><strong>Und es hat eine Folge, die fast immer übersehen wird:</strong> Es gibt nur <em>ein</em> Schema für diese Antwort, und das wird im Gateway gegen jede Antwort validiert. Steht dort <code>required: [id, name, geburtsdatum]</code>, dann ist eine gefilterte Antwort <strong>schemawidrig</strong> – das Gateway wirft die eigene Antwort weg. Wer <code>fields=</code> anbietet, muss also entweder alle Felder außer der Kennung optional machen – <em>und damit die Zusage aufgeben, dass ein Name kommt</em> – oder je Feldkombination ein eigenes Schema pflegen. Genau deshalb ist der saubere Weg meist ein anderer: die Anschriften gar nicht erst einbetten und <code>GET /customers/4711/addresses</code> als eigene Subressource anbieten. Zwei Ressourcen, zwei Schemata, beide vollständig."
      },
      anlegen: {
        anfrage: Z(
          "POST /customers HTTP/1.1",
          "Host: api.shop.example",
          "Content-Type: application/json",
          "",
          "{",
          '  "name": "Meier",',
          '  "geburtsdatum": "1984-03-02"',
          "}"),
        antwort: Z(
          "HTTP/1.1 201 Created",
          "Location: /customers/4711",
          "Content-Type: application/json",
          "",
          "{",
          '  "id": "4711",',
          '  "name": "Meier",',
          '  "geburtsdatum": "1984-03-02"',
          "}"),
        fehlertitel: "Antwort · die Daten sind nicht gültig",
        fehler: Z(
          "HTTP/1.1 400 Bad Request",
          "Content-Type: application/problem+json",
          "",
          "{",
          '  "type": "https://api.shop.example/probleme/validierung",',
          '  "title": "Eingabe nicht verarbeitbar",',
          '  "status": 400,',
          '  "fehler": [',
          '    { "feld": "geburtsdatum", "grund": "Pflichtangabe fehlt" },',
          '    { "feld": "name", "grund": "darf nicht leer sein" }',
          "  ]",
          "}"),
        hinweis: "<code>201</code> und <code>Location</code> gehören zusammen: Die Kennung vergibt der Server und <strong>nennt die Adresse, unter der die neue Ressource ab jetzt liegt</strong>. Deshalb ist <code>POST</code> hier nicht idempotent – zweimal abgeschickt, zwei Kunden. Und <strong>beide</strong> Feldfehler kommen in <em>einer</em> Antwort; sonst braucht der Aufrufer mehrere Anläufe für dasselbe Formular."
      },
      loeschen: {
        anfrage: Z(
          "DELETE /customers/4711 HTTP/1.1",
          "Host: api.shop.example"),
        antwort: Z(
          "HTTP/1.1 204 No Content"),
        fehlertitel: "Antwort · beim zweiten Mal",
        fehler: Z(
          "HTTP/1.1 404 Not Found",
          "Content-Type: application/problem+json",
          "",
          "{",
          '  "type": "https://api.shop.example/probleme/kunde-unbekannt",',
          '  "title": "Kunde nicht gefunden",',
          '  "status": 404,',
          '  "instance": "/customers/4711"',
          "}"),
        hinweis: "<strong>Die ganze Erfolgsantwort ist eine Zeile.</strong> Kein Body, kein Format, keine Absprache – der Statuscode <em>ist</em> die Antwort. Und der Aufruf ist idempotent: Der Zustand danach ist derselbe, egal wie oft er ankommt. Dass beim zweiten Mal <code>404</code> kommt, ändert daran nichts – der Zustand ist gemeint, nicht die Antwort."
      }
    },

    /* ============================================================ GraphQL */
    graphql: {
      alles: {
        anfrage: Z(
          "POST /graphql HTTP/1.1",
          "Host: api.shop.example",
          "Content-Type: application/json",
          "Accept: application/json",
          "",
          '{"query":"query { customer(id: \\"4711\\") { id name geburtsdatum' +
            ' anschriften { strasse ort } zahlungsarten { art letzte4 } } }"}'),
        antwort: Z(
          "HTTP/1.1 200 OK",
          "Content-Type: application/json",
          "",
          "{",
          '  "data": {',
          '    "customer": {',
          '      "id": "4711",',
          '      "name": "Meier",',
          '      "geburtsdatum": "1984-03-02",',
          '      "anschriften": [ { "strasse": "Hauptstr. 1", "ort": "Köln" } ],',
          '      "zahlungsarten": [ { "art": "KREDITKARTE", "letzte4": "4242" } ]',
          "    }",
          "  }",
          "}"),
        fehlertitel: "Antwort · den Kunden gibt es nicht",
        fehler: Z(
          "HTTP/1.1 200 OK",
          "Content-Type: application/json",
          "",
          "{",
          '  "data": { "customer": null },',
          '  "errors": [',
          "    {",
          '      "message": "Kunde 4711 unbekannt",',
          '      "path": [ "customer" ],',
          '      "extensions": { "code": "NOT_FOUND" }',
          "    }",
          "  ]",
          "}"),
        hinweis: "So sieht die Abfrage <strong>wirklich</strong> aus: ein JSON-Objekt mit der Query als Zeichenkette, Anführungszeichen maskiert. Lesbar formatiert wäre das <code>query { customer(id: \"4711\") { id name … } }</code> – aber über die Leitung geht die Zeile oben. <strong>Und der Fehler ist eine <code>200</code></strong>: Ob es geklappt hat, steht im Feld <code>errors</code>."
      },
      ohne: {
        anfrage: Z(
          "POST /graphql HTTP/1.1",
          "Host: api.shop.example",
          "Content-Type: application/json",
          "",
          '{"query":"query { customer(id: \\"4711\\") { id name geburtsdatum } }"}'),
        antwort: Z(
          "HTTP/1.1 200 OK",
          "Content-Type: application/json",
          "",
          "{",
          '  "data": {',
          '    "customer": {',
          '      "id": "4711",',
          '      "name": "Meier",',
          '      "geburtsdatum": "1984-03-02"',
          "    }",
          "  }",
          "}"),
        fehlertitel: "Antwort · das Feld gibt es im Schema nicht",
        fehler: Z(
          "HTTP/1.1 400 Bad Request",
          "Content-Type: application/json",
          "",
          "{",
          '  "errors": [',
          "    {",
          '      "message": "Cannot query field \\"telefon\\" on type \\"Customer\\".",',
          '      "locations": [ { "line": 1, "column": 42 } ],',
          '      "extensions": { "code": "GRAPHQL_VALIDATION_FAILED" }',
          "    }",
          "  ]",
          "}"),
        hinweis: "<strong>Das ist der Grund, warum es GraphQL gibt.</strong> Dieselbe Adresse, dieselbe Signatur – der Client lässt zwei Felder weg und bekommt weniger. Ohne zweite Operation, ohne neue Adresse, ohne Release. Interessant ist der Fehlerfall: Ein <em>Schreibfehler im Feldnamen</em> wird vor der Ausführung bemerkt und kommt hier sogar mit <code>400</code> – das ist die eine Stelle, an der GraphQL den Statuscode benutzt."
      },
      anlegen: {
        anfrage: Z(
          "POST /graphql HTTP/1.1",
          "Host: api.shop.example",
          "Content-Type: application/json",
          "",
          '{"query":"mutation($e: CustomerInput!) { createCustomer(input: $e) { id } }",',
          ' "variables":{"e":{"name":"Meier","geburtsdatum":"1984-03-02"}}}'),
        antwort: Z(
          "HTTP/1.1 200 OK",
          "Content-Type: application/json",
          "",
          "{",
          '  "data": {',
          '    "createCustomer": { "id": "4711" }',
          "  }",
          "}"),
        fehlertitel: "Antwort · die Daten sind nicht gültig",
        fehler: Z(
          "HTTP/1.1 200 OK",
          "Content-Type: application/json",
          "",
          "{",
          '  "data": { "createCustomer": null },',
          '  "errors": [',
          "    {",
          '      "message": "geburtsdatum ist eine Pflichtangabe",',
          '      "path": [ "createCustomer" ],',
          '      "extensions": {',
          '        "code": "BAD_USER_INPUT",',
          '        "feld": "geburtsdatum"',
          "      }",
          "    }",
          "  ]",
          "}"),
        hinweis: "Lesen und Ändern unterscheidet nur das Schlüsselwort <code>mutation</code>; Eingaben gehören in <code>variables</code>, nicht in die Query-Zeichenkette. Welche Felder zurückkommen, sagt auch hier der Client – hier nur die neue Kennung. <strong>Einen <code>Location</code>-Kopf gibt es nicht</strong>, und es gäbe auch keine Adresse dafür."
      },
      loeschen: {
        anfrage: Z(
          "POST /graphql HTTP/1.1",
          "Host: api.shop.example",
          "Content-Type: application/json",
          "",
          '{"query":"mutation { deleteCustomer(id: \\"4711\\") { erfolg } }"}'),
        antwort: Z(
          "HTTP/1.1 200 OK",
          "Content-Type: application/json",
          "",
          "{",
          '  "data": {',
          '    "deleteCustomer": { "erfolg": true }',
          "  }",
          "}"),
        fehlertitel: "Antwort · den Kunden gibt es nicht",
        fehler: Z(
          "HTTP/1.1 200 OK",
          "Content-Type: application/json",
          "",
          "{",
          '  "data": { "deleteCustomer": null },',
          '  "errors": [',
          '    { "message": "Kunde 4711 unbekannt",',
          '      "path": [ "deleteCustomer" ],',
          '      "extensions": { "code": "NOT_FOUND" } }',
          "  ]",
          "}"),
        hinweis: "Beide Antworten sind <code>200 OK</code> – die erfolgreiche und die gescheiterte. <strong>Ein Proxy, ein Log oder ein Alarm auf <code>5xx</code> sieht hier ausschließlich Erfolge.</strong> Wer GraphQL betreibt, braucht eine Auswertung, die in den Body schaut; mit HTTP-Bordmitteln kommt er nicht weit."
      }
    },

    /* =============================================================== gRPC */
    grpc: {
      alles: {
        anfrage: Z(
          "HTTP/2 · Stream 1 · HEADERS",
          "",
          ":method = POST",
          ":scheme = https",
          ":authority = api.shop.example",
          ":path = /kunden.v1.CustomerService/GetCustomer",
          "content-type = application/grpc+proto",
          "te = trailers",
          "",
          "DATA (Protobuf, binär):",
          "00 00 00 00 06  0a 04 34 37 31 31",
          "",
          "00           unkomprimiert",
          "00 00 00 06  Länge der Nachricht: 6 Bytes",
          "0a           Feld 1 (id), Typ \"Bytes\"",
          "04           4 Zeichen folgen",
          "34 37 31 31  \"4711\""),
        antwort: Z(
          "HTTP/2 · Stream 1 · HEADERS",
          "",
          ":status = 200",
          "content-type = application/grpc+proto",
          "",
          "DATA (Protobuf, binär):",
          "00 00 00 00 2b  0a 04 34 37 31 31  12 05 4d 65 69 65 72",
          "1a 0a 31 39 38 34 2d 30 33 2d 30 32  22 12 0a 0b 48 ...",
          "",
          "TRAILERS",
          "",
          "grpc-status = 0",
          "grpc-message ="),
        fehlertitel: "Antwort · den Kunden gibt es nicht",
        fehler: Z(
          "HTTP/2 · Stream 1 · HEADERS",
          "",
          ":status = 200",
          "content-type = application/grpc+proto",
          "",
          "(kein DATA-Frame)",
          "",
          "TRAILERS",
          "",
          "grpc-status = 5",
          "grpc-message = Kunde 4711 unbekannt",
          "",
          "5 = NOT_FOUND"),
        hinweis: "Die Adresse entsteht aus Dienst- und Methodennamen; niemand tippt das von Hand, der Client wird aus der <code>.proto</code> erzeugt. <strong>Und jetzt die Pointe: Auch der Fehler ist auf HTTP-Ebene eine <code>200</code>.</strong> Der eigentliche Status steht in einem <em>Trailer</em> – der kommt <em>nach</em> dem Body, und die meisten Werkzeuge zwischen Client und Server lesen ihn gar nicht."
      },
      ohne: {
        anfrage: Z(
          "HTTP/2 · Stream 3 · HEADERS",
          "",
          ":method = POST",
          ":path = /kunden.v1.CustomerService/GetCustomer",
          "content-type = application/grpc+proto",
          "",
          "DATA – GetCustomerRequest mit FieldMask:",
          "  id         = \"4711\"",
          "  field_mask = { paths: [\"id\", \"name\", \"birth_date\"] }",
          "",
          "(hier lesbar dargestellt – über die Leitung geht Protobuf)"),
        antwort: Z(
          "HTTP/2 · Stream 3 · HEADERS",
          "",
          ":status = 200",
          "content-type = application/grpc+proto",
          "",
          "DATA – Customer:",
          "  id         = \"4711\"",
          "  name       = \"Meier\"",
          "  birth_date = \"1984-03-02\"",
          "",
          "TRAILERS",
          "",
          "grpc-status = 0"),
        fehlertitel: "Antwort · der Pfad in der Maske stimmt nicht",
        fehler: Z(
          "HTTP/2 · Stream 3 · HEADERS",
          "",
          ":status = 200",
          "",
          "TRAILERS",
          "",
          "grpc-status = 3",
          "grpc-message = field_mask: unbekannter Pfad \"telefon\"",
          "",
          "3 = INVALID_ARGUMENT"),
        hinweis: "<code>FieldMask</code> ist standardisiert (<code>google.protobuf.FieldMask</code>) – aber <strong>der Server muss sie selbst auswerten</strong>. Tut er es nicht, kommt trotzdem alles zurück, und niemand merkt es. Anders als bei GraphQL erzwingt das Format nichts; die Maske ist ein Wunsch, kein Vertrag."
      },
      anlegen: {
        anfrage: Z(
          "HTTP/2 · Stream 5 · HEADERS",
          "",
          ":method = POST",
          ":path = /kunden.v1.CustomerService/CreateCustomer",
          "content-type = application/grpc+proto",
          "",
          "DATA – CreateCustomerRequest:",
          "  name          = \"Meier\"",
          "  geburtsdatum  = \"1984-03-02\""),
        antwort: Z(
          "HTTP/2 · Stream 5 · HEADERS",
          "",
          ":status = 200",
          "content-type = application/grpc+proto",
          "",
          "DATA – Customer:",
          "  id            = \"4711\"",
          "  name          = \"Meier\"",
          "  geburtsdatum  = \"1984-03-02\"",
          "",
          "TRAILERS",
          "",
          "grpc-status = 0"),
        fehlertitel: "Antwort · die Daten sind nicht gültig",
        fehler: Z(
          "HTTP/2 · Stream 5 · HEADERS",
          "",
          ":status = 200",
          "",
          "TRAILERS",
          "",
          "grpc-status = 3",
          "grpc-message = Validierung fehlgeschlagen",
          "grpc-status-details-bin = CAMSFVZhbGlkaWVydW5nIGZlaGxnZXNj...",
          "",
          "3 = INVALID_ARGUMENT · die Feldfehler stecken base64-kodiert",
          "im Trailer grpc-status-details-bin (google.rpc.Status)"),
        hinweis: "Der neue Kunde kommt als vollständige Nachricht zurück; einen <code>Location</code>-Kopf gibt es nicht. <strong>Und die Feldfehler stehen base64-kodiert in einem Trailer</strong> – lesbar erst, wenn man sie dekodiert und gegen die <code>.proto</code> hält. Das ist der Preis für die Kompaktheit."
      },
      loeschen: {
        anfrage: Z(
          "HTTP/2 · Stream 7 · HEADERS",
          "",
          ":method = POST",
          ":path = /kunden.v1.CustomerService/DeleteCustomer",
          "content-type = application/grpc+proto",
          "",
          "DATA – DeleteCustomerRequest:",
          "  id = \"4711\""),
        antwort: Z(
          "HTTP/2 · Stream 7 · HEADERS",
          "",
          ":status = 200",
          "content-type = application/grpc+proto",
          "",
          "DATA – google.protobuf.Empty (0 Bytes Nutzlast)",
          "",
          "TRAILERS",
          "",
          "grpc-status = 0"),
        fehlertitel: "Antwort · den Kunden gibt es nicht",
        fehler: Z(
          "HTTP/2 · Stream 7 · HEADERS",
          "",
          ":status = 200",
          "",
          "TRAILERS",
          "",
          "grpc-status = 5",
          "grpc-message = Kunde 4711 unbekannt",
          "",
          "5 = NOT_FOUND"),
        hinweis: "<strong>Der Status ist ein gRPC-Status, kein HTTP-Status.</strong> Die beiden haben nichts miteinander zu tun: <code>grpc-status = 5</code> steht in einem Trailer, auf HTTP-Ebene war die Antwort eine <code>200</code>. Wer zwischen Client und Server ein Gateway stellt, muss ihm das beibringen."
      }
    }
  };

  /* --------------------------------------------------- Syntaxhervorhebung
     Das Theme faerbt nur Java. Rohe HTTP-Nachrichten faerbt die Seite
     deshalb selbst: Kopfzeilen zeilenweise, den Rumpf nach seiner Art.   */

  function esc(t) {
    return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function kopfzeile(zeile) {
    var m;
    if ((m = zeile.match(/^([A-Z]+) (\S+) (HTTP\/[\d.]+)$/))) {
      return '<span class="hl-m">' + m[1] + '</span> ' +
             '<span class="hl-p">' + esc(m[2]) + '</span> ' +
             '<span class="hl-v">' + m[3] + "</span>";
    }
    if ((m = zeile.match(/^(HTTP\/[\d.]+) (\d)(\d\d)(.*)$/))) {
      return '<span class="hl-v">' + m[1] + '</span> ' +
             '<span class="hl-s' + m[2] + '">' + m[2] + m[3] + esc(m[4]) + "</span>";
    }
    if ((m = zeile.match(/^(:?[a-zA-Z][a-zA-Z0-9-]*)(\s*[:=]\s*)(.*)$/))) {
      return '<span class="hl-h">' + m[1] + "</span>" + m[2] + esc(m[3]);
    }
    return esc(zeile);
  }

  function json(t) {
    return t
      .replace(/"([^"\\]*(?:\\.[^"\\]*)*)"(\s*:)/g, '<span class="hl-k">"$1"</span>$2')
      .replace(/([:\[,]\s*)"([^"\\]*(?:\\.[^"\\]*)*)"/g, '$1<span class="hl-str">"$2"</span>')
      .replace(/([:\[,]\s*)(-?\d+(?:\.\d+)?|true|false|null)\b/g, '$1<span class="hl-num">$2</span>');
  }

  function xml(t) {
    /* Reihenfolge ist wichtig: erst die Zeichenketten, dann die Tags. Umgekehrt
       faerbt die Zeichenketten-Regel das eben eingefuegte class="hl-tag" mit. */
    return t
      .replace(/"([^"]*)"/g, '<span class="hl-str">"$1"</span>')
      .replace(/(&lt;\/?)([\w:.-]+)/g, '$1<span class="hl-tag">$2</span>');
  }

  /* Trennt am ersten Leerzeilen-Umbruch: davor der Kopf - das, was eine
     Zwischenstation ohne Hineinschauen sieht -, danach der Rumpf. */
  function teile(text) {
    var zeilen = text.split("\n");
    var kopf = [], rumpf = [], imKopf = true;

    for (var i = 0; i < zeilen.length; i++) {
      if (imKopf && zeilen[i] === "") { imKopf = false; continue; }
      (imKopf ? kopf : rumpf).push(zeilen[i]);
    }
    return {
      kopf: kopf.map(kopfzeile).join("\n"),
      zeilen: rumpf.length,
      rumpf: rumpf.length ? faerbeRumpf(rumpf) : ""
    };
  }

  function faerbeRumpf(rumpf) {
    var r = rumpf.join("\n"), erstes = r.replace(/^\s+/, "").charAt(0);
    if (erstes === "{" || erstes === "[") r = json(esc(r));
    else if (erstes === "<") r = xml(esc(r));
    else {
      /* Gemischter Rumpf (gRPC): Kopfzeilen faerben, Erklaerzeilen daempfen. */
      r = rumpf.map(function (z) {
        if (/^\(|^\d = |^[0-9a-f]{2}[\s0-9a-f]*(\.\.\.)?$/.test(z))
          return '<span class="hl-c">' + esc(z) + "</span>";
        if (/^(HTTP\/2|DATA|TRAILERS)/.test(z))
          return '<span class="hl-kw">' + esc(z) + "</span>";
        if (/^[0-9a-f]{2}[0-9a-f\s]*\s{2}\S/.test(z))
          return '<span class="hl-c">' + esc(z) + "</span>";
        if (/^(:?[a-zA-Z][a-zA-Z0-9-]*)(\s*[:=]\s*)/.test(z)) return kopfzeile(z);
        if (/^\s+\w+\s*=/.test(z))
          return z.replace(/^(\s+)(\w+)(\s*=\s*)(.*)$/, '$1<span class="hl-k">$2</span>$3<span class="hl-str">$4</span>');
        return esc(z);
      }).join("\n");
    }
    return r;
  }

  /* ---------------------------------------------------------- Bedienung */

  var wurzel = document.querySelector(".vs");
  if (!wurzel) return;

  var stil = "soap", fall = "alles";
  var fehlertitel = wurzel.querySelector("[data-vs-fehlertitel]");
  var hinweisFeld = wurzel.querySelector("[data-vs-hinweis]");

  function setze(name, text) {
    var t = teile(text);
    wurzel.querySelector('[data-vs-kopf="' + name + '"]').innerHTML = t.kopf;

    var falt = wurzel.querySelector('[data-vs-falt="' + name + '"]');
    falt.hidden = !t.zeilen;
    if (!t.zeilen) return;
    falt.querySelector("[data-vs-zahl]").textContent =
      "Body · " + t.zeilen + (t.zeilen === 1 ? " Zeile" : " Zeilen");
    falt.querySelector("[data-vs-rumpf]").innerHTML = t.rumpf;
  }

  function zeichne() {
    var d = DATEN[stil][fall];
    setze("anfrage", d.anfrage);
    setze("antwort", d.antwort);
    setze("fehler",  d.fehler);
    fehlertitel.textContent = d.fehlertitel;
    hinweisFeld.innerHTML   = d.hinweis;

    wurzel.querySelectorAll("[data-stil]").forEach(function (b) {
      var an = b.dataset.stil === stil;
      b.classList.toggle("is-aktiv", an);
      b.setAttribute("aria-selected", an ? "true" : "false");
    });
    wurzel.querySelectorAll("[data-fall]").forEach(function (b) {
      var an = b.dataset.fall === fall;
      b.classList.toggle("is-aktiv", an);
      b.setAttribute("aria-selected", an ? "true" : "false");
    });
  }

  wurzel.addEventListener("click", function (e) {
    var s = e.target.closest("[data-stil]");
    if (s) { stil = s.dataset.stil; zeichne(); merken(); return; }
    var f = e.target.closest("[data-fall]");
    if (f) { fall = f.dataset.fall; zeichne(); merken(); }
  });

  /* --- Zustand in der Adresse ---------------------------------------------
     STIL UND FALL SIND ZWEI ACHSEN - und genau die Kombination ist das, worauf
     ein Kapitel zeigen will („GraphQL, wenn nur zwei Felder gebraucht werden").
     Ohne Zustand in der Adresse landet jeder Verweis bei SOAP/alles, und ein
     Neuladen waehrend der Schulung wirft das Gespraech zurueck.

     Angemeldet wird bei `skr.state` des Skriptoriums statt selbst ins
     Fragment zu schreiben: Es gibt nur eines je Seite. Erst bei DOMContentLoaded,
     weil das Theme-Skript `defer` traegt und damit nach diesem hier laeuft. */
  function merken() { if (window.skr && window.skr.state) { window.skr.state.update(); } }

  function anmelden() {
    if (!(window.skr && window.skr.state)) { return; }
    function achse(schluessel, holen, setzen) {
      window.skr.state.register({
        key: schluessel,
        read: holen,
        apply: function (wert) {
          /* Nur bekannte Werte - eine von Hand getippte Adresse darf Unsinn
             enthalten, und dann bleibt es beim Ausgangszustand. */
          if (!wurzel.querySelector("[data-" + schluessel + '="' + wert.replace(/[^a-z0-9-]/gi, "") + '"]')) { return; }
          setzen(wert);
          zeichne();
        }
      });
    }
    achse("stil", function () { return stil; }, function (w) { stil = w; });
    achse("fall", function () { return fall; }, function (w) { fall = w; });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", anmelden);
  } else {
    anmelden();
  }

  zeichne();
})();
