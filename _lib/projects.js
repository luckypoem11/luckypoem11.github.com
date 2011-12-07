// Dependencies
// ------------

var
  fs    = require('fs'),
  https = require('https');

// Constants
// ---------

var
  NAV_FILE = process.argv[2] || '_includes/nav_projects.html',
  USERNAME = 'neocotic';

// Variables
// ---------

var html = '';

// Helper functions
// ----------------

// Append a divider to the HTML.
function addMenuDivider() {
  if (html) html += '\n';
  html += '<li class="divider"></li>';
}

// Append a menu item including a link for text and URL provided to the HTML.
function addMenuItem(text, url) {
  if (html) html += '\n';
  html += '<li><a href="' + url + '">' + text + '</a></li>';
}

// Write the menu HTML to the navigation includes file.
function writeMenu() {
  fs.writeFile(NAV_FILE, html, function (err) {
    if (err) throw err;
    console.log('Navigation updated!');
  });
}

// Process
// -------

// Request JSON for repos from GitHub's API
var req = https.request({
  host: 'api.github.com',
  path: '/users/' + USERNAME + '/repos'
}, function (res) {
  var data = '';
  res.on('data', function (pkg) {
    data += pkg;
    try {
      // Try to parse JSON, but more data packages may be required.
      data = JSON.parse(data.toString());
      // Ensure array was parsed.
      if (data && data.length) {
        // Sort repos alphabetically based on their names.
        data.sort(function (a, b) {
          a = a.name.toLowerCase();
          b = b.name.toLowerCase();
          if (a === b) return 0;
          return (a < b) ? -1 : 1;
        });
        // Append menu items for each repo.
        for (var i = 0; i < data.length; i++) {
          // Filter repos to remove pages and forked repos.
          if (data[i].name !== USERNAME + '.github.com' && !data[i].fork) {
            addMenuItem(data[i].name, '/' + data[i].name);
          }
        }
        addMenuDivider();
      }
      addMenuItem('View All', 'https://github.com/' + USERNAME);
      writeMenu();
    } catch (e) {}
  });
}).on('error', function () {
  addMenuItem('View All', 'https://github.com/' + USERNAME);
  writeMenu();
});
req.end();