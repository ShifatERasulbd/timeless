import { Outlet } from 'react-router-dom';

import Footer from '../components/Footer.jsx';
import Header from '../components/Header.jsx';
import NewsLetter from '../components/NewsLetter.jsx';

export default function FrontendLayout() {
    return (
        <div className="min-h-screen bg-white text-zinc-950">
            <Header />
            <main>
                <Outlet />
            </main>
            <NewsLetter />
            <Footer />
        </div>
    );
}