import Head from "next/head"
import clsx from "clsx"
import Footer from "@components/footer"
import Navigation from "@components/navigation"
import UserListView from "@components/client/client-list-view"

export default function Home() {
	return (
		<div>
			<Head>
				<title>Velt Voice</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<main className="bg-primary-100">
				<Navigation />
				<UserListView
					className={clsx(
						"px-6 py-4 flex flex-col items-stretch",
						"sm:grid sm:grid-cols-2 sm:items-start sm:gap-y-2 sm:gap-x-2",
						"md:grid-cols-2 md:gap-y-2 md:gap-x-2 md:py-6",
						"lg:px-12 lg:grid-cols-3 lg:gap-y-3 lg:gap-x-10 lg:py-10",
					)}
				/>
				<Footer />
			</main>
		</div>
	)
}
