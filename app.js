var express = require('express');
var Asana = require('asana');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jade = require('jade');
var config = require('config');
var app = express();

// Causes request cookies to be parsed, populating `req.cookies`.
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

app.set('views', './views');
app.set('view engine', 'jade');

var clientId = config.get('oauth.client_id');
var clientSecret = config.get('oauth.client_secret');
var port = config.get('port') || 3000;
var redirect_uri = config.get('oauth.redirect_uri');

// Create an Asana client. Do this per request since it keeps state that
// shouldn't be shared across requests.
function createClient() {
    return Asana.Client.create({
        clientId: clientId,
        clientSecret: clientSecret,
        redirectUri: redirect_uri
    });
}

var client = createClient();

// Home page - shows user name if authenticated, otherwise seeks authorization.
app.get('/', function (req, res) {
    client = createClient();
    // If token is in the cookie, use it to show info.
    var token = req.cookies.token;
    if (token) {
        // Here's where we direct the client to use Oauth with the credentials
        // we have acquired.
        client.useOauth({credentials: token});
        client.users.me({opt_expand: 'workspaces'}).then(function (me) {
            var user = me.name;
            var orgs = me.workspaces.filter(function (w) {
                return w.is_organization
            });
            res.render('home', {user: user, orgs: orgs});
        }).catch(function (err) {
            res.end('Error fetching user: ' + err);
        });
    } else {
        res.render('welcome')
    }

});

app.post('/', function (req, res) {
    if (req.body.org) {
        var users = client.users.findByWorkspace(req.body.org, {opt_expand: "this"}).then(function (users) {
            res.render('users', {users: users.data})
        });
    }
});

app.get('/signin', function (req, res) {
    res.redirect(client.app.asanaAuthorizeUrl())
});

// Authorization callback - redirected to from Asana.
app.get('/oauth_callback', function (req, res) {
    var code = req.param('code');
    if (code) {
        // If we got a code back, then authorization succeeded.
        // Get token. Store it in the cookie and redirect home.
        var client = createClient();
        client.app.accessTokenFromCode(code).then(function (credentials) {

            res.cookie('token', credentials.access_token, {maxAge: 60 * 60 * 1000});
            // Redirect back home, where we should now have access to Asana data.
            res.redirect('/');
        });
    } else {
        // Authorization could have failed. Show an error.
        res.render('error');
    }

});

app.listen(port);