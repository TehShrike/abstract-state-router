
var router = require('.')

router.state('splash', {
	url: 'awesomeSplashPage'
	someData: 'lol',
	resolve: function(done, redirect) {
		setTimeout(function() {
			done('fancy shenanigans!')
		}, 2000)
	},
	display: function(ctx, data) {

	}
})

router.state('splash.fancy', {
	url: '/fancy',
	display: function(data) {

	}
})
