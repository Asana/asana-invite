# Asana User Management Sample Application

This application leverages the Asana API to demonstrate how an administrator might manage the members in an
organization.

The application uses OAuth 2.0 for authentication and the `addUser` & `removeUser` endpoints on a workspaces 
to demonstrate how they may function together.

## Dependencies
* [nodejs](https://nodejs.org/en/download/)
* [jade](http://jade-lang.com/)

## Setup

* `git clone https://github.com/Asana/asana-invite.git && cd asana-invite`
* `npm install`
* `cp config/example.default.json config/default.json`
* Fill `default.json` in with your OAuth Application credentials 
which can be obtained at https://app.asana.com/-/account_api
* `node app.js`