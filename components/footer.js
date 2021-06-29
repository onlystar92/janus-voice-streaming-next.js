import { forwardRef, useRef, useState } from 'react';
import clsx from 'clsx';
import TermsOfServiceModal from 'components/terms-of-service';
import PrivacyPolicyModal from 'components/privacy-policy';

function QuickLink({ className, text, href }) {
  return (
    <li className={clsx('bg-primary-300 rounded-md py-2 pl-4', className)}>
      <a href={href} target="_blank" rel="noreferrer">
        {text}
      </a>
    </li>
  );
}

const TermsOfServiceLink = forwardRef(({ open, onClick, closeModal }, ref) => (
  <div ref={ref} className="relative">
    <button
      className="focus:outline-none underline"
      aria-label="Terms of Service"
      type="button"
      onClick={onClick}
    >
      Terms of Service
    </button>
    <div
      className={clsx(
        'fixed pin overflow-auto flex top-0 left-0 h-full w-full transition-all duration-150',
        {
          'opacity-0 scale-75 -z-1': !open,
          'opacity-100 z-20': open,
        }
      )}
    >
      <TermsOfServiceModal closeModal={closeModal} />
    </div>
  </div>
));

TermsOfServiceLink.displayName = 'TermsOfServiceLink';

const PrivacyPolicyLink = forwardRef(({ open, onClick, closeModal }, ref) => (
  <div ref={ref} className="relative">
    <button
      className="focus:outline-none underline"
      aria-label="Privacy Policy"
      type="button"
      onClick={onClick}
    >
      Privacy Policy
    </button>
    <div
      className={clsx(
        'fixed pin overflow-auto flex top-0 left-0 h-full w-full transition-all duration-150',
        {
          'opacity-0 scale-75 -z-1': !open,
          'opacity-100 z-20': open,
        }
      )}
    >
      <PrivacyPolicyModal closeModal={closeModal} />
    </div>
  </div>
));

PrivacyPolicyLink.displayName = 'PrivacyPolicyLink';

const Footer = () => {
  const [openTermsModal, setOpenTermsModal] = useState(false);
  const [openPrivacyModal, setOpenPrivacyModal] = useState(false);
  const termsLink = useRef();
  const privacyLink = useRef();

  return (
    <footer className="relative py-8 px-6 bg-secondary-100 rounded-t-lg lg:py-14 lg:flex lg:justify-center lg:items-start lg:rounded-t-3xl">
      <div className="text-primary-text lg:ml-auto lg:w-1/4 xl:ml-64">
        <h4 className="text-xl font-bold">About Us</h4>
        <p className="mt-2 text-lg opacity-60">
          VeltPvP is a custom Minecraft server specializing in Hardcore Factions
          (HCF). We support MC clients from 1.7.x to 1.8.x. Connect via
          veltpvp.com.
        </p>
        <div className="flex mt-3">
          <TermsOfServiceLink
            ref={termsLink}
            closeModal={() => setOpenTermsModal(false)}
            open={openTermsModal}
            onClick={() => setOpenTermsModal(true)}
          />
          <span className="mx-2">|</span>
          <PrivacyPolicyLink
            ref={privacyLink}
            closeModal={() => setOpenPrivacyModal(false)}
            open={openPrivacyModal}
            onClick={() => setOpenPrivacyModal(true)}
          />
        </div>
      </div>
      <div className="mt-8 text-primary-text lg:mt-0 lg:ml-8 lg:w-1/4">
        <h4 className="text-xl font-bold">Quick Links</h4>
        <ul className="mt-2">
          <QuickLink text="Forums" href="https://www.veltpvp.com" />
          <QuickLink
            className="mt-2"
            text="Store"
            href="https://store.veltpvp.com"
          />
          <QuickLink
            className="mt-2"
            text="Discord"
            href="https://www.discord.gg/velt"
          />
        </ul>
        <img
          className="mt-8 w-32 md:hidden lg:block xl:hidden"
          src="/hylist-logo.png"
          alt="Hylist logo"
          width="auto"
          height="auto"
        />
      </div>
      <img
        className="mt-8 w-32 lg:absolute lg:right-12 lg:self-end lg:hidden xl:block"
        src="/hylist-logo.png"
        alt="Hylist logo"
        width="auto"
        height="auto"
      />
    </footer>
  );
};

export default Footer;
