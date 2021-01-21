import clsx from "clsx"

const QuickLink = ({ className, text, href }) => (
	<li className={clsx("bg-primary-300 rounded-md py-2 pl-4", className)}>
		<a href={href}>{text}</a>
	</li>
)

const Footer = () => (
	<footer className="relative py-8 px-6 bg-secondary-100 rounded-t-lg lg:py-14 lg:flex lg:justify-center lg:items-center lg:rounded-t-3xl">
		<div className="text-primary-text lg:w-1/4">
			<h4 className="text-xl font-bold">About Us</h4>
			<p className="mt-2 text-lg opacity-60">
				VeltPvP is a custom Minecraft server specializing in Hardcore Factions (HCF). We support MC
				clients from 1.7.x to 1.8.x. Connect via veltpvp.com.
			</p>
		</div>
		<div className="mt-8 text-primary-text lg:mt-0 lg:ml-8 lg:w-1/4">
			<h4 className="text-xl font-bold">Quick Links</h4>
			<ul className="mt-2">
				<QuickLink text="Forums" href="https://www.veltpvp.com" />
				<QuickLink className="mt-2" text="Store" href="https://store.veltpvp.com" />
				<QuickLink className="mt-2" text="Discord" href="https://www.discord.gg/velt" />
			</ul>
		</div>
		<img
			className="mt-8 w-32 sm:w-32 md:w-32 lg:absolute lg:right-12 lg:self-end"
			src="/hylist-logo.png"
			alt="Logo of the compnay"
		/>
	</footer>
)

export default Footer
