var Asana = require('asana');
var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jade = require('jade');
var config = require('config');
var app = express();

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: config.get('secret'),
    resave: false,
    saveUninitialized: true
}));

app.set('views', './views');
app.set('view engine', 'jade');

var clientId = config.get('oauth.client_id');
var clientSecret = config.get('oauth.client_secret');
var port = config.get('port') || 3000;
var redirect_uri = config.get('oauth.redirect_uri');


var sessionClients = new Map();
// Create an Asana client. Do this per request since it keeps state that
// shouldn't be shared across requests.
function createClient() {
    return Asana.Client.create({
        clientId: clientId,
        clientSecret: clientSecret,
        redirectUri: redirect_uri
    });
}

// Home
app.get('/', function (req, res) {
    // If client is in the session, use it.

    var client = sessionClients.get(req.session.id);

    if (client) {
        // Here's where we direct the client to use Oauth with the credentials
        // we have acquired.

        client.users.me({opt_expand: 'workspaces'}).then(function (me) {
            var user = me.name;
            var orgs = me.workspaces.filter(function (w) {
                return w.is_organization
            });
            req.session.orgs = orgs;
            req.session.user = user;
            res.render('home', {user: user, orgs: orgs});
        }).catch(function (err) {
            res.end('Error fetching user: ' + err);
        });
    } else {
        res.render('welcome')
    }

});

// OAuth flow
app.get('/signin', function (req, res) {
    var client = createClient();
    res.redirect(client.app.asanaAuthorizeUrl())
});

// Authorization callback - redirected to from Asana.
app.get('/oauth_callback', function (req, res) {
    var code = req.query.code;
    if (code) {
        // If we got a code back, then authorization succeeded.
        // Create a client for this session
        var client = createClient();
        client.app.accessTokenFromCode(code).then(function (credentials) {
            // Redirect back home, where we should now have access to Asana data.
            client.useOauth({credentials: credentials});
            sessionClients.set(req.session.id, client);
            res.redirect('/');
        });
    } else {
        // Authorization could have failed. Show an error.
        res.render('error');
    }
});

// POST
app.post('/', function (req, res) {
    var client = getClientFromSession(req, res);
    var current_org = req.session.orgs.filter(function (o) {
        return o.id == req.body.org;
    })[0];
    req.session.current_org = current_org;

    var users = client.users.findByWorkspace(current_org.id, {opt_expand: "this"}).then(function (users) {
        req.session.users = users;
        res.render('users', {org: current_org.name, users: users.data})
    }).catch(function (err) {
        res.render('error', err)
    });
});

app.post('/invite', function (req, res) {
    var client = getClientFromSession(req, res);
    var invitee = req.body.invitee;
    var org = req.session.current_org;
    var data = {user: invitee};
    var path = "/workspaces/" + org.id + "/addUser";
    var client = getClientFromSession(req, res);
    client.dispatcher.post(path, data).then(function (response) {
        console.log(response)
    }).catch(function (err) {
        console.log(err);
        res.render('error', err);
    });
});

app.post('/decommission', function (req, res) {
    var client = getClientFromSession(req, res);
    var user = req.body.user_id;
    var org = req.session.current_org;
    var data = {user: user};
    var path = "/workspaces/" + org + "/removeUser";
    client.dispatcher.post(path, data).then(function (response) {
        console.log(response);
    }).catch(function (err) {
        console.log(err);
    });
});

// Helpers
function getClientFromSession(req, res) {
    var client = sessionClients.get(req.session.id);
    if (client) {
        return client
    } else {
        console.log("Client not in session");
        res.render("Error");
    }
};

app.listen(port);