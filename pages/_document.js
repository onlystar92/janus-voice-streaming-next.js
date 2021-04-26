import Document, { Html, Head, Main, NextScript } from "next/document"

class MyDocument extends Document {
	static async getInitialProps(ctx) {
		const initialProps = await Document.getInitialProps(ctx)
		return { ...initialProps }
	}

	render() {
		return (
			<Html className="overflow-y-scroll" lang="en">
				<Head />
				<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
				<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
				<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
				<link rel="manifest" href="/site.webmanifest" />
				<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#151a46" />
				<meta name="msapplication-TileColor" content="#252e7b" />
				<meta name="theme-color" content="#252e7b" />
				<link rel="preconnect" href="https://fonts.gstatic.com" />
				<link
					href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700"
					rel="stylesheet"
				/>
				<body className="scrollbar-w-2 scrollbar scrollbar-thumb-primary-text scrollbar-track-primary-100 scrollbar-thumb-rounded-full">
					<Main />
					<NextScript />
				</body>
			</Html>
		)
	}
}

export default MyDocument
