import React from "react";

export default function KeyActives() {
  const blocks = [
    {
      title: "Design & Product",
      svg: (
        <svg
          aria-hidden="true"
          focusable="false"
          role="presentation"
          className="h-12 w-12 text-black"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeMiterlimit="10"
        >
          <path d="M44.18 67.51 30 89.72l-4.44-12.19-12.93 1.1 14.19-22.18a28.86 28.86 0 0 0 13.79 10.08 26.93 26.93 0 0 0 3 .85Zm43.19 11.12-12.93-1.1L70 89.72 55.81 67.51l.63-.13a26.76 26.76 0 0 0 2.94-.85 28.8 28.8 0 0 0 13.8-10.08Z" />
          <path d="M78.92 39.19a28.82 28.82 0 0 1-3.61 14 30 30 0 0 1-1.74 2.73 5 5 0 0 1-.39.52 28.8 28.8 0 0 1-13.79 10.09 26.76 26.76 0 0 1-2.94.85l-.63.13a29 29 0 0 1-11.63 0l-.62-.13a26.93 26.93 0 0 1-3-.85 28.86 28.86 0 0 1-13.75-10.08c-.13-.17-.26-.34-.38-.52q-.93-1.32-1.74-2.73a28.92 28.92 0 1 1 54.22-14Z" />
          <path d="m56.95 42.84 1.63 9.55L50 47.88l-8.58 4.51 1.64-9.55-6.95-6.77 9.6-1.39 4.29-8.7 4.29 8.7 9.6 1.39-6.94 6.77z" />
        </svg>
      ),
    },
    {
      title: "Photoshoots & Cataloging",
      svg: (
        <svg
          aria-hidden="true"
          focusable="false"
          role="presentation"
          className="h-12 w-12 text-black"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeMiterlimit="10"
        >
          <path d="m63.41 68 21-10.58a4.16 4.16 0 0 1 5.67 2 4.17 4.17 0 0 1-1.93 5.39L54 82a3.35 3.35 0 0 1-2.16.25L39 75.82l-7.31 3.06m-8.93 7.79L9.6 55.92l10.24-4.64 13.17 30.75-10.25 4.64z" />
          <path d="m23.17 58.17 8.79-4a9.51 9.51 0 0 1 6.88-.37l22.25 7.31A4.52 4.52 0 0 1 63.41 68a4.51 4.51 0 0 1-5 1.77L43.8 65.32m35.57-48.38a12.34 12.34 0 0 0-17.44 0l-.79.79-.78-.79a12.34 12.34 0 1 0-17.44 17.45l.78.78 17.44 17.45 17.45-17.45.78-.78a12.34 12.34 0 0 0 0-17.45Z" />
        </svg>
      ),
    },
    {
      title: "Client Consultation & Support",
      svg: (
        <svg
          aria-hidden="true"
          focusable="false"
          role="presentation"
          className="h-12 w-12 text-black"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeMiterlimit="10"
        >
          <path d="M13.35 30.07h73.29v15.11H13.35zm4.53 15.11h64.23V87.5H17.88zM50 30.07V87.5M29.63 15.42a6.59 6.59 0 0 0-.81 4.33 7.75 7.75 0 0 0 1.39 3.94c2.48 2.65 8 5.94 19.88 6.38a21 21 0 0 0-4.26-12.2A13.13 13.13 0 0 0 36 12.51c-2.37-.09-4.89.49-6.37 2.91Z" />
          <path d="M69.9 14.75a6.55 6.55 0 0 1 1.29 5 8 8 0 0 1-1.39 4c-2.49 2.65-8 5.94-19.89 6.38a20.93 20.93 0 0 1 4.22-12.14A13.12 13.12 0 0 1 64 12.51a6.94 6.94 0 0 1 5.9 2.24Z" />
        </svg>
      ),
    },
    {
      title: "Easy Returns",
      svg: (
        <svg
          aria-hidden="true"
          focusable="false"
          role="presentation"
          className="h-12 w-12 text-black"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeMiterlimit="10"
        >
          <path d="M16.96 11.72h66.08v70.76l-6.62 5.8-6.61-5.8-6.61 5.8-6.61-5.8-6.61 5.8-6.6-5.8-6.61 5.8-6.61-5.8-6.6 5.8-6.6-5.8V11.72zm7.01 22.88h49.36M23.97 46.28h49.01M23.97 57.96h28.57M23.97 69.64h28.57" />
          <path d="M61.63 66.87c0 2.69 4.18 2.51 4.18 2.51s4.19.27 4.19-3.23c0-2.27-4.16-2.25-4.16-2.25-4.85 0-4.16-3.33-4.16-3.33 0-3.74 4.22-3.43 4.22-3.43 4.51 0 4.08 3.43 4.08 3.43m-4.18-7.54v20.46M23.97 23.41h49.36" />
        </svg>
      ),
    },
  ];

  return (
    <section className="my-16 border-t border-b border-black/10 py-14 bg-white font-serif">
      <div className="mx-auto max-w-[1300px] px-4">
        <h2 className="text-center font-serif text-[22px] md:text-[26px] uppercase tracking-[0.2em] text-[#111111] mb-12 font-semibold">
          Key Actives
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center items-start">
          {blocks.map((b) => (
            <div key={b.title} className="flex flex-col items-center px-2">
              <div className="flex h-16 w-16 items-center justify-center mb-4 text-black">
                {b.svg}
              </div>
              <h3 className="font-serif text-[13px] md:text-[14px] font-bold uppercase tracking-[0.1em] text-black leading-snug">
                {b.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
