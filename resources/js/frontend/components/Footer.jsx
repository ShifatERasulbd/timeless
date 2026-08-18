import { timelessFontClass } from '../../utils/typography';
import { Link } from 'react-router-dom';

const quickLinks = ['Home', 'About', 'Services', 'Single Item', 'Contact'];

const helpLinks = ['Track Your Order', 'Returns + Exchanges', 'Shipping + Delivery', 'Contact Us', 'FAQs'];

const socialLinks = [
    {
        label: 'Facebook',
        href: '#facebook',
        icon: (
            <path d="M13.5 7H11V5.5c0-.6.4-1 1-1h1V2h-2c-1.7 0-3 1.3-3 3v2H6v2.5h2V18h3.5V9.5h2l.5-2.5Z" fill="currentColor" />
        ),
    },
    {
        label: 'Instagram',
        href: '#instagram',
        icon: (
            <>
                <rect x="4.5" y="4.5" width="15" height="15" rx="4" stroke="currentColor" strokeWidth="1.6" fill="none" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" fill="none" />
                <circle cx="16.5" cy="7.5" r="1" fill="currentColor" />
            </>
        ),
    },
    {
        label: 'LinkedIn',
        href: '#linkedin',
        icon: (
            <>
                <rect x="4.5" y="8" width="3" height="10" rx="1" fill="currentColor" />
                <circle cx="6" cy="5.8" r="1.4" fill="currentColor" />
                <path d="M11 8v10h3v-5.8c0-1.2.8-2.2 2-2.2s2 1 2 2.2V18h3v-6.5c0-2.5-1.4-4.2-3.8-4.2-1.5 0-2.7.7-3.2 1.8V8h-3Z" fill="currentColor" />
            </>
        ),
    },
    {
        label: 'Twitter',
        href: '#twitter',
        icon: (
            <path d="M18.5 7.2c.01.2.01.4.01.6 0 6.2-4.7 13.3-13.3 13.3-2.6 0-5.1-.8-7.2-2.2.4.1.8.1 1.2.1 2.2 0 4.2-.7 5.8-2-2.1 0-3.8-1.4-4.4-3.3.3.1.7.1 1 .1.4 0 .8-.1 1.2-.2-2.2-.4-3.8-2.4-3.8-4.7v-.1c.7.4 1.6.7 2.5.7-1.4-1-2.2-2.7-2.2-4.4 0-.9.2-1.7.7-2.5 2.4 2.9 5.9 4.8 9.8 5-.1-.4-.2-.8-.2-1.2 0-2.5 2-4.5 4.5-4.5 1.3 0 2.5.5 3.3 1.4 1-.2 2-.6 2.8-1.1-.3 1-1 1.8-1.9 2.3.9-.1 1.7-.4 2.5-.7-.6.8-1.4 1.5-2.3 2.1Z" fill="currentColor" />
        ),
    },
    {
        label: 'Blog',
        href: '#blog',
        icon: (
            <path d="M6 4.5h10A3.5 3.5 0 0 1 19.5 8v8A3.5 3.5 0 0 1 16 19.5H8A3.5 3.5 0 0 1 4.5 16V6A1.5 1.5 0 0 1 6 4.5Zm1.5 5h7v1.5h-7V9.5Zm0 3h5v1.5h-5V12.5Z" fill="currentColor" />
        ),
    },
];

const paymentMarks = ['VISA', 'MC', 'PAYPAL'];

function IconButton({ href, label, children }) {
    return (
        <a
            href={href}
            aria-label={label}
            className="inline-flex size-8 items-center justify-center text-[#a3a39d] transition-colors hover:text-zinc-950"
        >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                {children}
            </svg>
        </a>
    );
}

export default function Footer() {
    return (
        <footer className={`${timelessFontClass} border-t border-zinc-200 bg-zinc-200 text-zinc-900`}>
            <div className="w-full px-6 pb-10 pt-10 sm:px-8 lg:px-12 lg:pt-14">
                <div className="grid gap-12 lg:grid-cols-[1.15fr_0.8fr_0.8fr_1fr] lg:gap-16 xl:grid-cols-[1.25fr_0.78fr_0.78fr_1fr]">
                    <section className="max-w-md space-y-5">
                        <Link to="/" className="inline-flex text-3xl font-black tracking-[0.18em] text-black sm:text-[1.6rem]">
                            TIMELESS
                        </Link>

                        <p className="max-w-sm text-[1.05rem] leading-[1.5] text-zinc-600 sm:text-[.9rem]">
                            Welcome to Timeless Fashion, where quality meets creativity and every thread tells a story. Proudly Canadian and built on years of industry expertise, we’re more than just a textile company.
                        </p>

                        <div className="flex items-center gap-2">
                            {socialLinks.map((item) => (
                                <IconButton key={item.label} href={item.href} label={item.label}>
                                    {item.icon}
                                </IconButton>
                            ))}
                        </div>
                    </section>

                    <nav aria-label="Quick links" className="space-y-4">
                        <h2 className="font-serif text-[2rem] font-normal uppercase tracking-[0.06em] text-zinc-900 sm:text-[1.5rem]">
                            Quick Links
                        </h2>
                        <ul className="space-y-1 text-[1.03rem] uppercase tracking-[0.12em] text-zinc-950 sm:text-[.8rem]">
                            {quickLinks.map((item) => (
                                <li key={item}>
                                    <a href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="transition-colors hover:text-zinc-500">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <nav aria-label="Help and info" className="space-y-4">
                        <h2 className="font-serif text-[2rem] font-normal uppercase tracking-[0.06em] text-zinc-900 sm:text-[1.5rem]">
                            Help &amp; Info
                        </h2>
                        <ul className="space-y-1 text-[1.03rem] uppercase tracking-[0.12em] text-zinc-950 sm:text-[.8rem]">
                            {helpLinks.map((item) => (
                                <li key={item}>
                                    <a href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="transition-colors hover:text-zinc-500">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <section className="space-y-4">
                        <h2 className="font-serif text-[2rem] font-normal uppercase tracking-[0.06em] text-zinc-900 sm:text-[1.5rem]">
                            Contact Us
                        </h2>

                        <div className="space-y-5 text-[1.05rem] leading-[1.45] text-zinc-700 sm:text-[.9rem]">
                            <p>
                                Do you have any questions or suggestions?
                                <br />
                                <a href="mailto:hello@timeless.ca" className="text-zinc-950 transition-colors hover:text-zinc-500">
                                    hello@timelessfashion.ca
                                </a>
                            </p>

                            <p>
                                Do you need support? Give us a call.
                                <br />
                                <a href="tel:+2123456789" className="text-zinc-950 transition-colors hover:text-zinc-500">
                                    (2) 123 -456 -789
                                </a>
                            </p>

                            <p>
                                <span className="block text-zinc-500">Location</span>
                                70 Washington SquareNew York, NY 10012, USA
                            </p>
                        </div>
                    </section>
                </div>
            </div>

            <div className="border-t border-zinc-200">
                <div className="flex w-full flex-col gap-6 px-6 py-5 text-[0.85rem] text-zinc-600 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                        <div className="flex items-center gap-3">
                            <span>We ship with:</span>
                            <span className="text-[1.05rem] font-semibold tracking-[0.2em] text-zinc-400">DHL</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span>Payment options:</span>
                            <div className="flex items-center gap-2">
                                {paymentMarks.map((mark) => (
                                    <span key={mark} className="inline-flex h-5 items-center rounded bg-zinc-300 px-1.5 text-[0.62rem] font-semibold tracking-[0.12em] text-white">
                                        {mark}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-[0.85rem] leading-6 text-zinc-600 lg:text-right">
                        © Copyright 2026 Timeless.ca. All rights reserved. 
                    </p>
                </div>
            </div>
        </footer>
    );
}