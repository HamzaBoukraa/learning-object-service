# Compare

This directory contains resources for convenient testing and analysis of lo-suggestion services.

## compare-parsing.script

Use this script to test how fast different methods of parsing input take. For example, using oboe instead of a traditional Angular http request may provide faster access to the first results, while later packets containing the rest of the list come in. Or it might not. It probably depends on the number of objects, so use this to test it and any other ideas we have.

## compare-suggestion

`compare-suggestion.service` is essentially the usual `lo-suggestion.service`, but is meant to implement different or specialized search techniques. Create a services.*.json file in compare-suggestion containing a `services` list with the routes you use.

`compare-suggestion.client` serves up the files of `compare-suggestion`, and acts as a proxy server so those files can interact with the outside world correctly. After running the client program, visit `localhost:5000` on a browser for an interface to make the suggestion requests to the service program. Both results and times are recorded.

You may also use `compare-suggestion.client` to check on results from the production server. Just switch the `host` variable, and in `compare-suggestion/angular.js`, switch the `json` variable to `services.live.json`.