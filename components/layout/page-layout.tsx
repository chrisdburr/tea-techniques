import { Footer } from './footer';
import { Header } from './header';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className={`flex-1 ${className}`}>{children}</main>
      <Footer />
    </div>
  );
}
