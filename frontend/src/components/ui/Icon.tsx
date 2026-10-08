type IconProps = { name: string; className?: string; title?: string };

export function Icon({ name, className = '', title }: IconProps) {
  return (
    <span className={`material-symbols-outlined ${className}`} aria-hidden={title ? undefined : true} title={title}>
      {name}
    </span>
  );
}
