const { NormalModuleReplacementPlugin } = require("webpack")

module.exports = {
	poweredByHeader: false,
	webpack: config => {
		config.plugins = config.plugins || []

		config.plugins = [
			...config.plugins,

			// Configure module replacement
			new NormalModuleReplacementPlugin(
				/^(\.\.\/){3,}other\//,
				resource => (resource.request = resource.request.slice(6)),
			),
		]

		return config
	},
}
