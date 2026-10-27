# Tokenmeter

Ein kleines Panel für Claude, das neben dem Chat anzeigt, wie viel vom Abo-Kontingent schon verbraucht ist:

- **5-Stunden-Fenster** und **7-Tage-Fenster**: verbrauchte Prozent, Rest und Zeitpunkt der Zurücksetzung
- **Kontext der Sitzung**: wie voll das Kontextfenster des aktuellen Chats ist
- **API-Gegenwert der Sitzung** in US$ (das ist nicht der Abo-Preis)

Die Werte kommen aus der Antwort der Claude-API und aktualisieren sich nach jeder Antwort von Claude. Vor der ersten Antwort einer Sitzung ist die Anzeige leer. Absolute Token-Zahlen für das Abo gibt es nicht, nur Prozentwerte.

Öffnen: Das Panel öffnet sich beim Start einer Sitzung; sonst mit dem Befehl `/tokenmeter`.

## Installation

Im Terminal (Claude Code):

```
/plugin install tokenmeter --marketplace R00deboy/claude-tokenmeter
```

Aus einer Shell:

```
claude plugin install tokenmeter --marketplace R00deboy/claude-tokenmeter
```

In der Desktop-App: auf **+** neben dem Eingabefeld klicken, dann **Plugins**, **Add marketplace** mit `R00deboy/claude-tokenmeter`, dann **Add plugin**.
