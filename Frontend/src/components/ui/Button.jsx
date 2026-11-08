export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  icon: Icon,
}) => {
  const base =
    'inline-flex items-center justify-center font-medium transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-offset-2';

  const sizeClasses = {
    sm: 'text-xs px-3.5 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
    lg: 'text-base px-6 py-3 rounded-xl gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-[#1B2CC1] text-white hover:bg-[#16249c] active:bg-[#0f1a74] focus:ring-[#7692FF] shadow-sm hover:shadow-md hover:-translate-y-0.5',
    secondary:
      'bg-white text-[#091540] border border-slate-200 hover:bg-[#ABD2FA]/20 active:bg-[#ABD2FA]/40 focus:ring-[#7692FF] shadow-sm',
    accent:
      'bg-[#7692FF] text-white hover:bg-[#5b7ceb] focus:ring-[#1B2CC1] shadow-sm',
    ghost:
      'text-[#091540] hover:bg-slate-100 hover:text-[#1B2CC1] focus:ring-slate-300',
    danger:
      'text-rose-600 hover:bg-rose-50 hover:text-rose-700 focus:ring-rose-200',
    dark:
      'bg-[#091540] text-white hover:bg-[#11215b] focus:ring-[#7692FF]',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizeClasses[size]} ${variantClasses[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed hover:transform-none' : ''
      } ${className}`}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      {children}
    </button>
  );
};
