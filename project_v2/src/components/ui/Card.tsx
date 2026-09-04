import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const Comp = hover ? motion.div : 'div';
  return (
    <Comp
      {...(hover
        ? {
            whileHover: { y: -3, transition: { duration: 0.2 } },
            onClick,
          }
        : {})}
      className={`bg-white rounded-xl border border-slate-200 card-shadow ${hover ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </Comp>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-5 py-4 border-b border-slate-100 ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-base font-semibold text-navy-900 ${className}`}>{children}</h3>;
}
