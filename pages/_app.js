import React from "react"
import "../styles/globals.css"

React.useLayoutEffect = React.useEffect

function MyApp({ Component, pageProps }) {
	return <Component {...pageProps} />
}

export default MyApp
