type PageHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHeading({ eyebrow, title, description }: PageHeadingProps) {
  return (
    <div className="max-w-3xl">
      <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.24em] text-emerald-400">
        {eyebrow}
      </p>
      <h1 className="text-balance text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">
        {title}
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
        {description}
      </p>
    </div>
  );
}

