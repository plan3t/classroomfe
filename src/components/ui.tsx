import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '@/src/lib/utils';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20', className)}>{children}</div>;
}

export function Button({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn('rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50', className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm" {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm" {...props} />;
}
