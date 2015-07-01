# Asana Org MGMT App

This application leverages the Asana API to demonstrate how an administrator might manager the members in an
organization. It currently simply leverages the `addUser` & `removeUser` endpoints on a workspaces to demonstrate this
but can and may be extended to demonstrate more complex management.

## Dependencies
* nodejs

## Setup

* `git clone https://github.com/Asana/asana-invite.git && cd asana-invite`
* `npm install`
* `cp config/example.default.json config/default.json`
* Fill `default.json` in with your OAuth Application credentials
* `node app.js`