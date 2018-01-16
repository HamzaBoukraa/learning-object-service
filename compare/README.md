# Compare

This directory contains resources for convenient testing and analysis of lo-suggestion services.

## compare-parsing.script

Use this script to test how fast different methods of parsing input take. For example, using oboe instead of a traditional Angular http request may provide faster access to the first results, while later packets containing the rest of the list come in. Or it might not. It probably depends on the number of objects, so use this to test it and any other ideas we have.

## compare-outcomes

`compare-outcomes.service` implements the usual `lo-suggestion.service` `suggestOutcomes` route API, but does so with different implementations, so their results and efficiency can be easily compared. Create a services.*.json file in compare-suggestion containing a `services` list with the routes you use.

`compare-outcomes.client` serves up the files of `compare-outcomes`, and acts as a proxy server so those files can interact with the outside world correctly. After running the client program, visit `localhost:5000` on a browser for an interface to make the suggestion requests to the service program. Both results and times are recorded.

You may also use `compare-outcomes.client` to check on results from the production server. Just switch the `host` variable, and in `compare-outcomes/angular.js`, switch the `json` variable to `services.live.json`.

## compare-objects

This is essentially the same as compare-outcomes, but for comparing/measuring the `suggestObjects` route.