var tests = [];
for (var file in window.__karma__.files) {
	if (/-spec\.js$/.test(file)) {
		tests.push(file);
	}
}

requirejs.config({
	// Karma serves files from '/base'
	baseUrl: '/base',

	paths: {
		Kernel: 'src/Kernel'
	},

	// ask Require.js to load these files (all our tests)
	deps: tests,

	// start test run, once Require.js is done
	callback: window.__karma__.start
});

require([
], function() {

	before(function() {
		sinon.stub(console, 'info');
		sinon.stub(console, 'warn');
		sinon.stub(console, 'error');
	});
});